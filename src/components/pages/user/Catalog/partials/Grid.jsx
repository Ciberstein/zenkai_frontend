import React from 'react'
import AnimeCard from '../../../../shared/AnimeCard'
import NoData from '../../../../shared/NoData'

// ─── Grid ─────────────────────────────────────────────────────────────────────

const Grid = ({ items = [], ranked = false }) => {

  if (!items.length) return <NoData message="Prueba con otros filtros" />;

  return (
    <div className="stagger grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((anime, index) => (
        <AnimeCard
          key={anime.mal_id ?? anime.id ?? index}
          anime={anime}
          rank={ranked ? index + 1 : null}
        />
      ))}
    </div>
  )
}

export default Grid
