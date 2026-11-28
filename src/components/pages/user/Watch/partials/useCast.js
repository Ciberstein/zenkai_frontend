import React from 'react'
import { isIOS } from '../../../../../utils/install'

// ─── useCast ──────────────────────────────────────────────────────────────────

// Transmitir el video a una TV. Hay dos mundos y el navegador decide cual toca:
//   · AirPlay (Safari y los navegadores de iPhone): el propio <video> se manda a la TV, asi que
//     los controles de siempre siguen valiendo y aqui solo se abre el selector del sistema.
//   · Google Cast (Chrome, Edge...): la TV (Chromecast o con Chromecast integrado) descarga el
//     video por su cuenta; el reproductor local se pausa y los controles pasan al panel de
//     transmision, que maneja el reproductor remoto.
// El boton solo aparece cuando de verdad hay una TV cerca.
//
// Google Cast carga el SDK de Google, y solo en navegadores donde puede funcionar.

const SDK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

let sdk = null;

const loadSdk = () => {
  sdk ??= new Promise((resolve) => {
    if (window.cast?.framework) return resolve(true);

    window.__onGCastApiAvailable = (ok) => resolve(Boolean(ok));

    const script = document.createElement('script');
    script.src = SDK;
    script.async = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return sdk;
};

// Chromecast reproduce lo que ve en una URL: se le da la del manifiesto o la del mp4.
const mediaFor = ({ source, isHls, subtitles, cors, title, subtitle, image }) => {
  const { chrome } = window;

  const media = new chrome.cast.media.MediaInfo(source.url, isHls ? 'application/x-mpegURL' : 'video/mp4');
  media.streamType = chrome.cast.media.StreamType.BUFFERED;

  const meta = new chrome.cast.media.GenericMediaMetadata();
  meta.title = title ?? '';
  meta.subtitle = subtitle ?? '';
  if (image) meta.images = [new chrome.cast.Image(image)];
  media.metadata = meta;

  // Subtitulos aparte (WebVTT): el receptor los pide por su cuenta, y necesita CORS.
  const list = cors ? subtitles : [];
  media.tracks = list.map((item, index) => {
    const track = new chrome.cast.media.Track(index + 1, chrome.cast.media.TrackType.TEXT);
    track.trackContentId = item.url;
    track.trackContentType = 'text/vtt';
    track.subtype = chrome.cast.media.TextTrackType.SUBTITLES;
    track.name = item.label;
    track.language = item.language;
    return track;
  });

  return { media, list };
};

const useCast = ({ video, mediaKey, source, isHls, subtitles, caption, cors, title, subtitle, image }) => {

  const [kind, setKind] = React.useState(null);             // 'airplay' | 'cast' | null
  const [available, setAvailable] = React.useState(false);  // hay TVs cerca
  const [casting, setCasting] = React.useState(false);
  const [device, setDevice] = React.useState(null);
  const [remote, setRemote] = React.useState({ paused: false, time: 0, duration: 0, state: 'IDLE' });
  const [error, setError] = React.useState(null);

  // Ultimo valor de lo que hace falta al cargar, sin reiniciar los escuchas del SDK.
  const live = React.useRef({});
  live.current = { source, isHls, subtitles, caption, cors, title, subtitle, image };

  const timeRef = React.useRef(null);      // posicion remota mientras se transmite (null si no)
  const player = React.useRef(null);       // cast.framework.RemotePlayer
  const controller = React.useRef(null);   // cast.framework.RemotePlayerController
  const loadedUrl = React.useRef(null);

  // ── AirPlay ────────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const node = video.current;
    if (!node || typeof node.webkitShowPlaybackTargetPicker !== 'function') return;

    setKind('airplay');

    const onAvailability = (event) => setAvailable(event.availability === 'available');
    const onWireless = () => setCasting(Boolean(node.webkitCurrentPlaybackTargetIsWireless));

    node.addEventListener('webkitplaybacktargetavailabilitychanged', onAvailability);
    node.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', onWireless);

    return () => {
      node.removeEventListener('webkitplaybacktargetavailabilitychanged', onAvailability);
      node.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', onWireless);
    };
  }, [mediaKey, video]);

  // ── Google Cast ────────────────────────────────────────────────────────────

  const load = React.useCallback(async (session, start) => {
    const { chrome } = window;
    const current = live.current;
    if (!current.source) return;

    setError(null);

    const { media, list } = mediaFor(current);
    const request = new chrome.cast.media.LoadRequest(media);
    request.currentTime = start ?? video.current?.currentTime ?? 0;
    request.autoplay = true;

    const index = list.findIndex((item) => `db:${item.id}` === current.caption);
    if (index >= 0) request.activeTrackIds = [index + 1];

    video.current?.pause();

    const failure = await session.loadMedia(request);

    if (failure) {
      setError('No se pudo transmitir este video a la TV.');
      return;
    }

    loadedUrl.current = current.source.url;
    setCasting(true);
  }, [video]);

  React.useEffect(() => {
    // Safari/iPhone van por AirPlay; el SDK de Google solo existe en navegadores de Chromium.
    if (isIOS() || !window.chrome || typeof video.current?.webkitShowPlaybackTargetPicker === 'function') return;

    let live_ = true;
    let cleanup = () => {};

    loadSdk().then((ok) => {
      if (!ok || !live_ || !window.cast?.framework) return;

      const { cast, chrome } = window;
      const context = cast.framework.CastContext.getInstance();

      context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      setKind('cast');

      const remotePlayer = new cast.framework.RemotePlayer();
      const remoteController = new cast.framework.RemotePlayerController(remotePlayer);
      player.current = remotePlayer;
      controller.current = remoteController;

      const onCastState = () => {
        const state = context.getCastState();
        setAvailable(state !== cast.framework.CastState.NO_DEVICES_AVAILABLE);
      };

      const sync = () => {
        if (remotePlayer.isConnected) timeRef.current = remotePlayer.currentTime;

        // La TV acepto la orden pero no pudo reproducir (lo tipico: el almacenamiento no manda CORS
        // al receptor de Chromecast, que pide el video desde www.gstatic.com). Sin esto el panel
        // se quedaria esperando para siempre.
        const reason = context.getCurrentSession()?.getMediaSession()?.idleReason;

        if (remotePlayer.playerState === 'IDLE' && reason === 'ERROR') {
          console.warn('[cast] el receptor no pudo reproducir', live.current.source?.url);
          setError('La TV no pudo reproducir este video. Prueba con otro servidor o vuelve a transmitir.');
        } else if (remotePlayer.playerState && remotePlayer.playerState !== 'IDLE') {
          setError(null);
        }

        setRemote({
          paused: remotePlayer.isPaused,
          time: remotePlayer.currentTime,
          duration: remotePlayer.duration,
          state: remotePlayer.playerState ?? 'IDLE',
        });
      };

      // Al cortar la transmision el video local sigue donde iba la TV.
      const onConnected = () => {
        if (remotePlayer.isConnected) return;

        const at = timeRef.current;
        timeRef.current = null;
        loadedUrl.current = null;
        setCasting(false);
        setDevice(null);

        const node = video.current;
        if (node && at != null) {
          node.currentTime = at;
          node.play().catch(() => {});
        }
      };

      const onSession = (event) => {
        const { SessionState } = cast.framework;

        if (event.sessionState === SessionState.SESSION_STARTED || event.sessionState === SessionState.SESSION_RESUMED) {
          setDevice(event.session.getCastDevice()?.friendlyName ?? 'tu TV');

          // Reabrir la pagina con la TV ya reproduciendo esto: se retoma el control sin recargar.
          if (remotePlayer.isConnected && remotePlayer.mediaInfo?.contentId === live.current.source?.url) {
            loadedUrl.current = live.current.source.url;
            video.current?.pause();
            setCasting(true);
          } else {
            load(event.session);
          }
        }
      };

      context.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, onCastState);
      context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, onSession);
      remoteController.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGED, sync);
      remoteController.addEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, onConnected);

      onCastState();

      cleanup = () => {
        context.removeEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, onCastState);
        context.removeEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, onSession);
        remoteController.removeEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGED, sync);
        remoteController.removeEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, onConnected);
        // Salir de la pagina corta la transmision: ya no habria desde donde controlarla.
        if (remotePlayer.isConnected) context.endCurrentSession(true);
      };
    });

    return () => { live_ = false; cleanup(); };
  }, [load, video]);

  // Otro episodio (o servidor) mientras se transmite: la TV pasa al nuevo, sin cortar la sesion.
  React.useEffect(() => {
    if (kind !== 'cast' || !casting || !source?.url || loadedUrl.current === source.url) return;

    const session = window.cast.framework.CastContext.getInstance().getCurrentSession();
    if (session) load(session, 0);
  }, [kind, casting, source?.url, load]);

  // ── Acciones ───────────────────────────────────────────────────────────────

  const request = () => {
    setError(null);

    if (kind === 'airplay') {
      video.current?.webkitShowPlaybackTargetPicker();
    } else if (kind === 'cast') {
      window.cast.framework.CastContext.getInstance().requestSession().catch(() => {});
    }
  };

  const stop = () => {
    if (kind === 'cast') window.cast.framework.CastContext.getInstance().endCurrentSession(true);
    else video.current?.webkitShowPlaybackTargetPicker?.();
  };

  const toggle = () => controller.current?.playOrPause();

  const seekTo = (seconds) => {
    if (!player.current) return;

    player.current.currentTime = Math.max(0, Math.min(seconds, player.current.duration || seconds));
    controller.current.seek();
  };

  const seekBy = (delta) => seekTo((player.current?.currentTime ?? 0) + delta);

  // Con Cast el panel propio lleva el control; con AirPlay el video local sigue mandando.
  const remoteControl = kind === 'cast' && casting;

  return { kind, available, casting, remoteControl, device, remote, error, timeRef, request, stop, toggle, seekTo, seekBy };
};

export default useCast;
