export function getSpotifyTrackUri(spotifyId: string): string {
  return `spotify:track:${spotifyId}`;
}

export function getSpotifyTrackUrl(spotifyId: string): string {
  return `https://open.spotify.com/track/${spotifyId}`;
}
