import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { addComment } from '../../../../../store/slices/comments.slice'
import { Button, Checkbox, Textarea } from '../../../../material'
import library_service from '../../../../../services/library.services'
import formatDate from '../../../../../utils/formatDate'
import Avatar from '../../../../shared/Avatar'

// ─── Comments ─────────────────────────────────────────────────────────────────

const Comments = ({ malId, auth }) => {

  const [body, setBody] = React.useState('');
  const [spoiler, setSpoiler] = React.useState(false);
  const [revealed, setRevealed] = React.useState([]);

  const comments = useSelector(state => state.comments);
  const account = useSelector(state => state.account);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;

    const res = await library_service.comment(malId, { body, spoiler });

    if (res?.data) {
      // El POST devuelve la fila cruda, sin el include de cuenta que si trae el
      // listado: se completa aqui para no recargar todo.
      dispatch(addComment({ ...res.data, account }));
      setBody('');
      setSpoiler(false);
    }
  };

  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <h2 className="flex items-baseline gap-3 text-[24px] md:text-[32px]">
        {t('Comments')}
        <span className="font-sans text-sm font-medium text-muted tnum">{comments.length}</span>
      </h2>

      {auth && (
        <form onSubmit={onSubmit} className="hud flex flex-col gap-3 border border-line bg-surface/60 p-4">
          <Textarea
            full
            name="body"
            placeholder="Escribe un comentario"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <div className="flex items-center justify-between gap-3">
            <Checkbox
              label="Contiene spoiler"
              checked={spoiler}
              onChange={(event) => setSpoiler(event.target.checked)}
            />
            <Button type="submit" size="sm" disabled={!body.trim()}>Publicar</Button>
          </div>
        </form>
      )}

      {!comments.length && (
        <p className="border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
          {auth ? 'Sé el primero en comentar esta serie.' : 'Inicia sesión para comentar esta serie.'}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3.5 bg-surface/60 p-4 ring-1 ring-inset ring-line">
            <Avatar
              src={comment.account?.profile?.avatar}
              name={comment.account?.username}
            />

            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 text-sm font-semibold">
                {comment.account?.profile?.nickname ?? comment.account?.username}
                <span className="text-xs font-normal text-muted">
                  {formatDate(comment.createdAt)}
                </span>
              </p>

              {comment.spoiler && !revealed.includes(comment.id) ? (
                <button
                  type="button"
                  onClick={() => setRevealed((prev) => [...prev, comment.id])}
                  className="mt-1.5 cursor-pointer border border-red-500/60 px-3 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                >
                  Mostrar spoiler
                </button>
              ) : (
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-fg/80">{comment.body}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Comments
