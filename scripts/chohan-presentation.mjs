// Public presentation depends only on phase and game identity, never on secret dice.
export function choConcealedPresentation(state, previousKey) {
  if (state?.phase !== 'hidden') return null;
  const key = `${state.gameId}:${state.round ?? 1}`;
  return { key, animate: !state.paused && previousKey !== key };
}
