export type Song = {
  song_id_number: number;
  song_id: string | null;
  album: string | null;
  album2: string | null;
  artist: string | null;
  artist2: string | null;
  genre: string | null;
  name: string | null;
  name2: string | null;
};

export type SongSearchResult = Pick<
  Song,
  "song_id_number" | "name" | "artist" | "album"
>;
