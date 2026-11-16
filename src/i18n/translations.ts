import type { SupportedLanguage } from '../../shared/gameData';

export interface UIStrings {
  common: {
    topPlayers: string;
    wordPacks: string;
    packs: string;
    muteSound: string;
    unmuteSound: string;
    back: string;
    close: string;
    refresh: string;
    tryAgain: string;
    dismiss: string;
    publicLabel: string;
    privateLabel: string;
    drawAndGuess: string;
    triviaBlitz: string;
    youTag: string;
    pts: string;
    languageLabel: string;
  };
  title: {
    tagline: string;
    zeroDownloads: string;
    activePack: string;
    upToPlayers: string;
    roomFullPrefix: string;
    roomFullSuffix: string;
    joinAsSpectator: string;
    yourNickname: string;
    nicknamePlaceholder: string;
    inkColor: string;
    avatarHeading: string;
    randomizeAvatar: string;
    tabColor: string;
    tabShape: string;
    tabEyes: string;
    tabMouth: string;
    tabGear: string;
    partyMode: string;
    roomVisibility: string;
    publicRanked: string;
    joinRole: string;
    playerRole: string;
    spectatorRole: string;
    roomCodePlaceholder: string;
    connecting: string;
    spectateRoom: string;
    joinRoom: string;
    createPartyRoom: string;
    soloWarmup: string;
    browsePacks: string;
    footerHint: string;
  };
  store: {
    heading: string;
    subheading: string;
    proPassTag: string;
    proPassTitle: string;
    proPassDesc: string;
    proPassActive: string;
    activateProPass: string;
    freePack: string;
    creatorBuilder: string;
    premiumPack: string;
    wordsCount: string;
    triviaCount: string;
    sampleLabel: string;
    selectedForRoom: string;
    useThisPack: string;
    unlockLabel: string;
    customTitle: string;
    customDesc: string;
    requiresCustomPack: string;
    saveCustomWords: string;
    unlockedBanner: string;
    proPassBanner: string;
    customSavedBanner: string;
  };
  solo: {
    title: string;
    sketchedCount: string;
    drawPrefix: string;
    skipPrompt: string;
    doneNext: string;
  };
  canvas: {
    pen: string;
    mark: string;
    fill: string;
    erase: string;
    undo: string;
    clear: string;
    sizeSuffix: string;
  };
  leaderboard: {
    title: string;
    subtitle: string;
    fetchError: string;
    emptyTitle: string;
    emptyDesc: string;
    growthSuffix: string;
    totalLabel: string;
    last7dSuffix: string;
    totalTrend: string;
    dailyEarned: string;
    earnedLabel: string;
    rankCol: string;
    playerCol: string;
    pointsCol: string;
    gameSingular: string;
    gamePlural: string;
    winSingular: string;
    winPlural: string;
    place1: string;
    place2: string;
    place3: string;
  };
  room: {
    copyInviteLink: string;
    linkCopied: string;
    leaveRoom: string;
    streak: string;
    players: string;
    spectators: string;
    watching: string;
    host: string;
    drawing: string;
    guessed: string;
    lockedIn: string;
    spectatorModeBanner: string;
    joinOpenSpot: string;
    roomFullLabel: string;
    partyLobby: string;
    lobbySubtitle: string;
    shareUrl: string;
    gameMode: string;
    wordTriviaPack: string;
    packLanguage: string;
    lockedStoreSuffix: string;
    storeBtn: string;
    rounds: string;
    roundSingular: string;
    roundPlural: string;
    drawTimer: string;
    publicLeaderboardTitle: string;
    publicLeaderboardDesc: string;
    needPlayersHint: string;
    playersReadySuffix: string;
    startParty: string;
    waitingForHost: string;
    goAdFree: string;
    yourTurnToDraw: string;
    toPickSuffix: string;
    chooseSecretWord: string;
    isChoosingWord: string;
    getReadyChat: string;
    drawLabel: string;
    lettersLabel: string;
    isPickingWord: string;
    questionOf: string;
    roundOf: string;
    turnCompleteNext: string;
    theWordWas: string;
    answerLabel: string;
    removeAds: string;
    continueNow: string;
    finalPodium: string;
    takesTheCrown: string;
    playAgain: string;
    waitingRematch: string;
    guessesPartyChat: string;
    spectatingPlaceholder: string;
    guessPlaceholder: string;
    chatPlaceholder: string;
    playersCountSuffix: string;
    ofWord: string;
    lockedInCount: string;
  };
  daily: {
    heading: string;
    sprintLabel: string;
    rewardsMeta: string;
    featuredPack: string;
    badgeUnlocked: string;
    wordsPreview: string;
    topFinishers: string;
    emptyFinishers: string;
    startSprint: string;
    replaySprint: string;
    loadingChallenge: string;
    wordProgress: string;
    drawPrefix: string;
    strokeHint: string;
    nextWord: string;
    finishChallenge: string;
    submitting: string;
    submitError: string;
    summaryTitle: string;
    summaryBadgeActive: string;
    bonusAwardedLabel: string;
    replayBonusNote: string;
    bestTimeLabel: string;
    backToLobby: string;
    badgeTooltip: string;
  };
  shortcuts: {
    title: string;
    sendChat: string;
    focusChat: string;
    triviaOption: string;
    pickWord: string;
    undoStroke: string;
    brushTools: string;
    copyLink: string;
    toggleMute: string;
    toggleGuide: string;
    chatHint: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, UIStrings> = {
  en: {
    common: {
      topPlayers: 'Top Players',
      wordPacks: 'Word Packs',
      packs: 'Packs',
      muteSound: 'Mute sound',
      unmuteSound: 'Unmute sound',
      back: 'Back',
      close: 'Close',
      refresh: 'Refresh',
      tryAgain: 'Try Again',
      dismiss: 'Dismiss',
      publicLabel: 'Public',
      privateLabel: 'Private',
      drawAndGuess: 'Draw & Guess',
      triviaBlitz: 'Trivia Blitz',
      youTag: '(You)',
      pts: 'pts',
      languageLabel: 'Language',
    },
    title: {
      tagline: 'Draw fast, shout guesses, or battle through trivia with friends in one browser link.',
      zeroDownloads: 'Zero downloads',
      activePack: 'Active pack:',
      upToPlayers: 'Up to 12 players',
      roomFullPrefix: 'Room',
      roomFullSuffix: 'is currently full. Watch the live game and send reactions while waiting for an open spot.',
      joinAsSpectator: 'Join Room {code} as Spectator',
      yourNickname: 'Your Nickname',
      nicknamePlaceholder: 'Enter nickname...',
      inkColor: 'Ink Color',
      avatarHeading: 'Avatar Studio',
      randomizeAvatar: 'Randomize',
      tabColor: 'Color',
      tabShape: 'Shape',
      tabEyes: 'Eyes',
      tabMouth: 'Mouth',
      tabGear: 'Gear',
      partyMode: 'Party Mode',
      roomVisibility: 'Room Visibility',
      publicRanked: 'Public (Ranked)',
      joinRole: 'Join Role',
      playerRole: 'Player',
      spectatorRole: 'Spectator',
      roomCodePlaceholder: 'Room Code',
      connecting: 'Connecting...',
      spectateRoom: 'Spectate {code}',
      joinRoom: 'Join Room {code}',
      createPartyRoom: 'Create Party Room',
      soloWarmup: 'Solo Sketch Warmup (1P)',
      browsePacks: 'Browse Packs & Pro Pass',
      footerHint: 'Draw with Mouse or Touch · Enter to Submit · Esc for Menu',
    },
    store: {
      heading: 'Word & Trivia Packs',
      subheading: 'Free starter packs include intermission sponsor cards. Upgrade any pack or activate the Hostel Pro Pass to go ad-free.',
      proPassTag: 'Hostel Pro Pass · One-time host unlock',
      proPassTitle: 'All Premium Packs + Custom Inside-Joke Builder + Ad-Free Rooms',
      proPassDesc: 'Friends join your link for free—only the room host needs the pack unlocked.',
      proPassActive: 'Pro Pass Active',
      activateProPass: 'Activate Pro Pass · $4.99',
      freePack: 'Free Pack',
      creatorBuilder: 'Creator Builder',
      premiumPack: 'Premium Pack',
      wordsCount: 'words',
      triviaCount: 'trivia',
      sampleLabel: 'Sample:',
      selectedForRoom: 'Selected for Room',
      useThisPack: 'Use This Pack',
      unlockLabel: 'Unlock',
      customTitle: 'Custom Inside-Joke Builder',
      customDesc: 'Add dorm nicknames, inside jokes, or campus spots (one per line or comma-separated).',
      requiresCustomPack: 'Requires Creator Pack or Pro Pass',
      saveCustomWords: 'Save & Use Custom Words',
      unlockedBanner: 'Unlocked "{title}" for your hosted rooms.',
      proPassBanner: 'Hostel Pro Pass activated: all packs, custom builder, and ad-free rooms unlocked.',
      customSavedBanner: 'Saved {count} custom words to your Custom Inside-Joke Pack.',
    },
    solo: {
      title: 'Solo Sketch Warmup',
      sketchedCount: 'sketched',
      drawPrefix: 'Draw:',
      skipPrompt: 'Skip Prompt',
      doneNext: 'Done · Next Prompt',
    },
    canvas: {
      pen: 'Pen',
      mark: 'Mark',
      fill: 'Fill',
      erase: 'Erase',
      undo: 'Undo',
      clear: 'Clear',
      sizeSuffix: 'size',
    },
    leaderboard: {
      title: 'Top Players',
      subtitle: 'Top 10 players ranked by total points earned across public rooms. Select any player to inspect their 7-day point growth.',
      fetchError: 'Could not fetch Top Players right now. Try refreshing.',
      emptyTitle: 'No public scores recorded yet',
      emptyDesc: 'Start a public Draw & Guess or Trivia Blitz room with friends to claim the top spot and unlock your 7-day point trend graph.',
      growthSuffix: '7-Day Point Growth',
      totalLabel: 'Total:',
      last7dSuffix: 'pts last 7d',
      totalTrend: 'Total Trend',
      dailyEarned: 'Daily Earned',
      earnedLabel: 'Earned:',
      rankCol: 'Rank',
      playerCol: 'Player',
      pointsCol: 'Total Points',
      gameSingular: 'game',
      gamePlural: 'games',
      winSingular: 'win',
      winPlural: 'wins',
      place1: '1st Place',
      place2: '2nd Place',
      place3: '3rd Place',
    },
    room: {
      copyInviteLink: 'Copy Invite Link',
      linkCopied: 'Link Copied!',
      leaveRoom: 'Leave Room',
      streak: 'Streak',
      players: 'Players',
      spectators: 'Spectators',
      watching: 'Watching',
      host: 'Host',
      drawing: 'Drawing',
      guessed: 'Guessed',
      lockedIn: 'Locked in',
      spectatorModeBanner: 'Spectator Mode · Watching live without taking turns. Send emoji reactions while waiting!',
      joinOpenSpot: 'Join Open Player Spot',
      roomFullLabel: 'Room full',
      partyLobby: 'Party Lobby · Room',
      lobbySubtitle: 'Pass this link around your dorm, group chat, or friends—no download needed.',
      shareUrl: 'Share URL',
      gameMode: 'Game Mode',
      wordTriviaPack: 'Word & Trivia Pack',
      packLanguage: 'Pack Language',
      lockedStoreSuffix: '(Locked - Pro Store)',
      storeBtn: 'Store',
      rounds: 'Rounds',
      roundSingular: 'Round',
      roundPlural: 'Rounds',
      drawTimer: 'Draw Timer',
      publicLeaderboardTitle: 'Public Game Leaderboard',
      publicLeaderboardDesc: 'Public games count toward the global Top Players rankings.',
      needPlayersHint: 'Need at least 2 active players in this room to start. Share the invite link with friends!',
      playersReadySuffix: 'players ready to play.',
      startParty: 'Start Party',
      waitingForHost: 'Waiting for host to start the game...',
      goAdFree: 'Go Ad-Free',
      yourTurnToDraw: 'Your turn to draw',
      toPickSuffix: 's to pick',
      chooseSecretWord: 'Choose a secret word',
      isChoosingWord: 'is choosing a word...',
      getReadyChat: 'Get ready to type your guesses in the party chat!',
      drawLabel: 'Draw:',
      lettersLabel: 'letters',
      isPickingWord: 'is picking a word',
      questionOf: 'Question',
      roundOf: 'Round',
      turnCompleteNext: 'Turn Complete · Next in',
      theWordWas: 'The word was',
      answerLabel: 'Answer:',
      removeAds: 'Remove Ads',
      continueNow: 'Continue Now',
      finalPodium: 'Final Podium',
      takesTheCrown: 'takes the crown!',
      playAgain: 'Play Again',
      waitingRematch: 'Waiting for host to start a rematch...',
      guessesPartyChat: 'Guesses & Party Chat',
      spectatingPlaceholder: 'Spectating · Send reactions above',
      guessPlaceholder: 'Type your guess...',
      chatPlaceholder: 'Chat with the room...',
      playersCountSuffix: 'players',
      ofWord: 'of',
      lockedInCount: 'locked in',
    },
    daily: {
      heading: 'Daily Challenge',
      sprintLabel: '5-Word Sprint',
      rewardsMeta: '1.5x Multiplier · Daily Badge · +250 pts',
      featuredPack: 'Featured pack:',
      badgeUnlocked: 'Daily Badge Active · 1.5x Points',
      wordsPreview: 'Today’s Word Set',
      topFinishers: 'Today’s Fastest Finishers',
      emptyFinishers: 'Be the first to finish today’s 5-word sprint and unlock the 1.5x boost.',
      startSprint: 'Start Daily Challenge',
      replaySprint: 'Replay for Faster Time',
      loadingChallenge: 'Loading today’s challenge...',
      wordProgress: 'Word {current} of {total}',
      drawPrefix: 'Draw:',
      strokeHint: 'Draw at least one stroke on the canvas before continuing.',
      nextWord: 'Next Word',
      finishChallenge: 'Claim Badge & 1.5x Boost',
      submitting: 'Saving Run...',
      submitError: 'Could not save your Daily Challenge run. Please try again.',
      summaryTitle: 'Daily Challenge Complete!',
      summaryBadgeActive: 'Your Daily Badge and 1.5x public point multiplier are active for today.',
      bonusAwardedLabel: 'Leaderboard Bonus',
      replayBonusNote: 'Already claimed today',
      bestTimeLabel: 'Run Time',
      backToLobby: 'Back to Lobby',
      badgeTooltip: 'Daily Challenge Champion · 1.5x Points',
    },
    shortcuts: {
      title: 'Room Keyboard Shortcuts',
      sendChat: 'Send chat or guess',
      focusChat: 'Focus chat box',
      triviaOption: 'Pick trivia option',
      pickWord: 'Choose secret word (drawer)',
      undoStroke: 'Undo last drawing stroke',
      brushTools: 'Pen / Marker / Fill / Eraser',
      copyLink: 'Copy room invite link',
      toggleMute: 'Toggle sound mute',
      toggleGuide: 'Open or close shortcuts',
      chatHint: 'Ctrl+Enter to send · / to focus · ? shortcuts',
    },
  },
  es: {
    common: {
      topPlayers: 'Mejores Jugadores',
      wordPacks: 'Paquetes',
      packs: 'Paquetes',
      muteSound: 'Silenciar',
      unmuteSound: 'Activar sonido',
      back: 'Volver',
      close: 'Cerrar',
      refresh: 'Actualizar',
      tryAgain: 'Reintentar',
      dismiss: 'Cerrar',
      publicLabel: 'Pública',
      privateLabel: 'Privada',
      drawAndGuess: 'Dibuja y Adivina',
      triviaBlitz: 'Trivia Rápida',
      youTag: '(Tú)',
      pts: 'pts',
      languageLabel: 'Idioma',
    },
    title: {
      tagline: 'Dibuja rápido, grita respuestas o compite en trivia con amigos desde un solo enlace.',
      zeroDownloads: 'Sin descargas',
      activePack: 'Paquete activo:',
      upToPlayers: 'Hasta 12 jugadores',
      roomFullPrefix: 'La sala',
      roomFullSuffix: 'está llena. Mira la partida en vivo y envía reacciones mientras esperas un lugar.',
      joinAsSpectator: 'Entrar a sala {code} como Espectador',
      yourNickname: 'Tu Apodo',
      nicknamePlaceholder: 'Escribe tu apodo...',
      inkColor: 'Color de Tinta',
      avatarHeading: 'Estudio de Avatar',
      randomizeAvatar: 'Aleatorio',
      tabColor: 'Color',
      tabShape: 'Forma',
      tabEyes: 'Ojos',
      tabMouth: 'Boca',
      tabGear: 'Accesorio',
      partyMode: 'Modo de Juego',
      roomVisibility: 'Visibilidad',
      publicRanked: 'Pública (Ranking)',
      joinRole: 'Entrar como',
      playerRole: 'Jugador',
      spectatorRole: 'Espectador',
      roomCodePlaceholder: 'Código',
      connecting: 'Conectando...',
      spectateRoom: 'Mirar sala {code}',
      joinRoom: 'Unirse a {code}',
      createPartyRoom: 'Crear Sala de Fiesta',
      soloWarmup: 'Práctica en Solitario (1J)',
      browsePacks: 'Ver Paquetes y Pase Pro',
      footerHint: 'Dibuja con Ratón o Táctil · Enter para Enviar · Esc para Menú',
    },
    store: {
      heading: 'Paquetes de Palabras y Trivia',
      subheading: 'Los paquetes gratis muestran anuncios breves entre turnos. Mejora un paquete o activa el Pase Pro para jugar sin anuncios.',
      proPassTag: 'Pase Pro · Desbloqueo único para anfitriones',
      proPassTitle: 'Todos los Paquetes + Creador de Bromas + Salas Sin Anuncios',
      proPassDesc: 'Tus amigos entran gratis con el enlace; solo el anfitrión necesita el paquete.',
      proPassActive: 'Pase Pro Activo',
      activateProPass: 'Activar Pase Pro · $4.99',
      freePack: 'Paquete Gratis',
      creatorBuilder: 'Creador',
      premiumPack: 'Paquete Premium',
      wordsCount: 'palabras',
      triviaCount: 'trivia',
      sampleLabel: 'Ejemplo:',
      selectedForRoom: 'Seleccionado para la Sala',
      useThisPack: 'Usar Este Paquete',
      unlockLabel: 'Desbloquear',
      customTitle: 'Creador de Palabras Personalizadas',
      customDesc: 'Agrega apodos, bromas internas o lugares del grupo (uno por línea o separados por comas).',
      requiresCustomPack: 'Requiere Paquete Creador o Pase Pro',
      saveCustomWords: 'Guardar y Usar Palabras',
      unlockedBanner: '"{title}" desbloqueado para tus salas.',
      proPassBanner: 'Pase Pro activado: todos los paquetes y salas sin anuncios desbloqueados.',
      customSavedBanner: 'Se guardaron {count} palabras en tu paquete personalizado.',
    },
    solo: {
      title: 'Práctica de Dibujo',
      sketchedCount: 'dibujadas',
      drawPrefix: 'Dibuja:',
      skipPrompt: 'Saltar Palabra',
      doneNext: 'Listo · Siguiente',
    },
    canvas: {
      pen: 'Lápiz',
      mark: 'Resaltar',
      fill: 'Rellenar',
      erase: 'Borrar',
      undo: 'Deshacer',
      clear: 'Limpiar',
      sizeSuffix: 'tamaño',
    },
    leaderboard: {
      title: 'Mejores Jugadores',
      subtitle: 'Top 10 por puntos totales en salas públicas. Toca cualquier jugador para ver su progreso de 7 días.',
      fetchError: 'No se pudo cargar la clasificación. Intenta actualizar.',
      emptyTitle: 'Aún no hay puntuaciones públicas',
      emptyDesc: 'Abre una sala pública de Dibuja y Adivina o Trivia para liderar el ranking y ver tu gráfica de 7 días.',
      growthSuffix: 'Progreso de 7 días',
      totalLabel: 'Total:',
      last7dSuffix: 'pts últimos 7d',
      totalTrend: 'Tendencia Total',
      dailyEarned: 'Ganados por Día',
      earnedLabel: 'Ganados:',
      rankCol: 'Puesto',
      playerCol: 'Jugador',
      pointsCol: 'Puntos Totales',
      gameSingular: 'partida',
      gamePlural: 'partidas',
      winSingular: 'victoria',
      winPlural: 'victorias',
      place1: '1.º Puesto',
      place2: '2.º Puesto',
      place3: '3.º Puesto',
    },
    room: {
      copyInviteLink: 'Copiar Enlace',
      linkCopied: '¡Enlace Copiado!',
      leaveRoom: 'Salir de la Sala',
      streak: 'Racha',
      players: 'Jugadores',
      spectators: 'Espectadores',
      watching: 'Mirando',
      host: 'Anfitrión',
      drawing: 'Dibujando',
      guessed: 'Adivinó',
      lockedIn: 'Respondido',
      spectatorModeBanner: 'Modo Espectador · Mirando en vivo sin turno. ¡Envía emojis mientras esperas!',
      joinOpenSpot: 'Tomar Lugar Libre',
      roomFullLabel: 'Sala llena',
      partyLobby: 'Sala de Espera · Sala',
      lobbySubtitle: 'Comparte este enlace en tu grupo o chat; no hace falta descargar nada.',
      shareUrl: 'Compartir URL',
      gameMode: 'Modo de Juego',
      wordTriviaPack: 'Paquete de Palabras y Trivia',
      packLanguage: 'Idioma del Paquete',
      lockedStoreSuffix: '(Bloqueado - Tienda)',
      storeBtn: 'Tienda',
      rounds: 'Rondas',
      roundSingular: 'Ronda',
      roundPlural: 'Rondas',
      drawTimer: 'Tiempo de Dibujo',
      publicLeaderboardTitle: 'Clasificación Pública',
      publicLeaderboardDesc: 'Las salas públicas suman puntos al ranking global de Mejores Jugadores.',
      needPlayersHint: 'Se necesitan al menos 2 jugadores activos para empezar. ¡Comparte el enlace!',
      playersReadySuffix: 'jugadores listos para jugar.',
      startParty: 'Iniciar Fiesta',
      waitingForHost: 'Esperando a que el anfitrión inicie la partida...',
      goAdFree: 'Quitar Anuncios',
      yourTurnToDraw: 'Tu turno de dibujar',
      toPickSuffix: 's para elegir',
      chooseSecretWord: 'Elige una palabra secreta',
      isChoosingWord: 'está eligiendo una palabra...',
      getReadyChat: '¡Prepárate para escribir tus respuestas en el chat!',
      drawLabel: 'Dibuja:',
      lettersLabel: 'letras',
      isPickingWord: 'está eligiendo palabra',
      questionOf: 'Pregunta',
      roundOf: 'Ronda',
      turnCompleteNext: 'Turno Terminado · Siguiente en',
      theWordWas: 'La palabra era',
      answerLabel: 'Respuesta:',
      removeAds: 'Quitar Anuncios',
      continueNow: 'Continuar Ahora',
      finalPodium: 'Podio Final',
      takesTheCrown: '¡se lleva la corona!',
      playAgain: 'Jugar de Nuevo',
      waitingRematch: 'Esperando a que el anfitrión reinicie...',
      guessesPartyChat: 'Respuestas y Chat',
      spectatingPlaceholder: 'Mirando · Envía reacciones arriba',
      guessPlaceholder: 'Escribe tu respuesta...',
      chatPlaceholder: 'Chatea con la sala...',
      playersCountSuffix: 'jugadores',
      ofWord: 'de',
      lockedInCount: 'listos',
    },
    daily: {
      heading: 'Reto Diario',
      sprintLabel: 'Sprint de 5 Palabras',
      rewardsMeta: 'Multiplicador 1.5x · Insignia Diaria · +250 pts',
      featuredPack: 'Paquete destacado:',
      badgeUnlocked: 'Insignia Activa · Puntos 1.5x',
      wordsPreview: 'Palabras de Hoy',
      topFinishers: 'Más Rápidos de Hoy',
      emptyFinishers: 'Sé el primero en completar las 5 palabras de hoy y desbloquear el multiplicador 1.5x.',
      startSprint: 'Iniciar Reto Diario',
      replaySprint: 'Repetir por Mejor Tiempo',
      loadingChallenge: 'Cargando el reto de hoy...',
      wordProgress: 'Palabra {current} de {total}',
      drawPrefix: 'Dibuja:',
      strokeHint: 'Dibuja al menos un trazo antes de continuar.',
      nextWord: 'Siguiente Palabra',
      finishChallenge: 'Reclamar Insignia y 1.5x',
      submitting: 'Guardando...',
      submitError: 'No se pudo guardar tu resultado. Intenta de nuevo.',
      summaryTitle: '¡Reto Diario Completado!',
      summaryBadgeActive: 'Tu Insignia Diaria y multiplicador 1.5x en salas públicas están activos hoy.',
      bonusAwardedLabel: 'Bono de Ranking',
      replayBonusNote: 'Ya reclamado hoy',
      bestTimeLabel: 'Tiempo Total',
      backToLobby: 'Volver al Inicio',
      badgeTooltip: 'Campeón del Reto Diario · Puntos 1.5x',
    },
    shortcuts: {
      title: 'Atajos de Teclado',
      sendChat: 'Enviar chat o respuesta',
      focusChat: 'Enfocar cuadro de chat',
      triviaOption: 'Responder opción de trivia',
      pickWord: 'Elegir palabra secreta (dibujante)',
      undoStroke: 'Deshacer último trazo',
      brushTools: 'Lápiz / Resaltar / Rellenar / Borrar',
      copyLink: 'Copiar enlace de invitación',
      toggleMute: 'Silenciar o activar sonido',
      toggleGuide: 'Abrir o cerrar atajos',
      chatHint: 'Ctrl+Enter enviar · / enfocar · ? atajos',
    },
  },
  fr: {
    common: {
      topPlayers: 'Meilleurs Joueurs',
      wordPacks: 'Thèmes',
      packs: 'Thèmes',
      muteSound: 'Couper le son',
      unmuteSound: 'Activer le son',
      back: 'Retour',
      close: 'Fermer',
      refresh: 'Actualiser',
      tryAgain: 'Réessayer',
      dismiss: 'Fermer',
      publicLabel: 'Publique',
      privateLabel: 'Privée',
      drawAndGuess: 'Dessin & Devinettes',
      triviaBlitz: 'Quiz Éclair',
      youTag: '(Vous)',
      pts: 'pts',
      languageLabel: 'Langue',
    },
    title: {
      tagline: 'Dessinez vite, devinez en direct ou affrontez vos amis en quiz via un simple lien.',
      zeroDownloads: 'Sans téléchargement',
      activePack: 'Thème actif :',
      upToPlayers: 'Jusqu’à 12 joueurs',
      roomFullPrefix: 'Le salon',
      roomFullSuffix: 'est complet. Regardez la partie en direct et envoyez des réactions en attendant une place.',
      joinAsSpectator: 'Rejoindre {code} en Spectateur',
      yourNickname: 'Votre Pseudo',
      nicknamePlaceholder: 'Entrez votre pseudo...',
      inkColor: 'Couleur d’Encre',
      avatarHeading: 'Studio d’Avatar',
      randomizeAvatar: 'Aléatoire',
      tabColor: 'Couleur',
      tabShape: 'Forme',
      tabEyes: 'Yeux',
      tabMouth: 'Bouche',
      tabGear: 'Accessoire',
      partyMode: 'Mode de Jeu',
      roomVisibility: 'Visibilité',
      publicRanked: 'Publique (Classée)',
      joinRole: 'Rejoindre en tant que',
      playerRole: 'Joueur',
      spectatorRole: 'Spectateur',
      roomCodePlaceholder: 'Code',
      connecting: 'Connexion...',
      spectateRoom: 'Observer {code}',
      joinRoom: 'Rejoindre {code}',
      createPartyRoom: 'Créer un Salon',
      soloWarmup: 'Échauffement Solo (1J)',
      browsePacks: 'Voir Thèmes & Pass Pro',
      footerHint: 'Dessinez à la souris ou au doigt · Entrée pour envoyer · Échap pour le menu',
    },
    store: {
      heading: 'Packs de Mots et Quiz',
      subheading: 'Les packs gratuits affichent une courte carte sponsor entre les tours. Débloquez un pack ou le Pass Pro pour jouer sans pub.',
      proPassTag: 'Pass Pro · Déblocage unique pour l’hôte',
      proPassTitle: 'Tous les Packs + Créateur Perso + Salons Sans Pub',
      proPassDesc: 'Vos amis rejoignent gratuitement : seul l’hôte a besoin du pack.',
      proPassActive: 'Pass Pro Actif',
      activateProPass: 'Activer Pass Pro · 4,99 $',
      freePack: 'Pack Gratuit',
      creatorBuilder: 'Créateur',
      premiumPack: 'Pack Premium',
      wordsCount: 'mots',
      triviaCount: 'quiz',
      sampleLabel: 'Aperçu :',
      selectedForRoom: 'Sélectionné pour le Salon',
      useThisPack: 'Utiliser ce Pack',
      unlockLabel: 'Débloquer',
      customTitle: 'Créateur de Mots Personnalisés',
      customDesc: 'Ajoutez vos surnoms, blagues internes ou lieux du groupe (un par ligne ou séparés par des virgules).',
      requiresCustomPack: 'Requiert le Pack Créateur ou Pass Pro',
      saveCustomWords: 'Enregistrer et Utiliser',
      unlockedBanner: '« {title} » débloqué pour vos salons.',
      proPassBanner: 'Pass Pro activé : tous les packs et salons sans publicité débloqués.',
      customSavedBanner: '{count} mots personnalisés enregistrés dans votre pack.',
    },
    solo: {
      title: 'Échauffement Dessin Solo',
      sketchedCount: 'dessinés',
      drawPrefix: 'Dessiner :',
      skipPrompt: 'Passer ce Mot',
      doneNext: 'Fait · Mot Suivant',
    },
    canvas: {
      pen: 'Stylo',
      mark: 'Surligneur',
      fill: 'Remplir',
      erase: 'Gomme',
      undo: 'Annuler',
      clear: 'Effacer',
      sizeSuffix: 'taille',
    },
    leaderboard: {
      title: 'Meilleurs Joueurs',
      subtitle: 'Top 10 des joueurs par points gagnés en salons publics. Cliquez sur un joueur pour voir sa progression sur 7 jours.',
      fetchError: 'Impossible de charger le classement. Réessayez.',
      emptyTitle: 'Aucun score public enregistré',
      emptyDesc: 'Lancez un salon public avec vos amis pour prendre la tête du classement et débloquer le graphique sur 7 jours.',
      growthSuffix: 'Progression 7 jours',
      totalLabel: 'Total :',
      last7dSuffix: 'pts sur 7j',
      totalTrend: 'Cumul Total',
      dailyEarned: 'Gains par Jour',
      earnedLabel: 'Gagnés :',
      rankCol: 'Rang',
      playerCol: 'Joueur',
      pointsCol: 'Points Totaux',
      gameSingular: 'partie',
      gamePlural: 'parties',
      winSingular: 'victoire',
      winPlural: 'victoires',
      place1: '1re Place',
      place2: '2e Place',
      place3: '3e Place',
    },
    room: {
      copyInviteLink: 'Copier le Lien',
      linkCopied: 'Lien Copié !',
      leaveRoom: 'Quitter le Salon',
      streak: 'Série',
      players: 'Joueurs',
      spectators: 'Spectateurs',
      watching: 'Observe',
      host: 'Hôte',
      drawing: 'Dessine',
      guessed: 'Trouvé',
      lockedIn: 'Validé',
      spectatorModeBanner: 'Mode Spectateur · Vous regardez en direct sans jouer. Envoyez des réactions en attendant !',
      joinOpenSpot: 'Prendre une Place Libre',
      roomFullLabel: 'Salon complet',
      partyLobby: 'Salon d’Attente · Code',
      lobbySubtitle: 'Partagez ce lien avec vos amis — aucun téléchargement requis.',
      shareUrl: 'Lien de partage',
      gameMode: 'Mode de Jeu',
      wordTriviaPack: 'Pack de Mots & Quiz',
      packLanguage: 'Langue du Pack',
      lockedStoreSuffix: '(Verrouillé - Boutique)',
      storeBtn: 'Boutique',
      rounds: 'Manches',
      roundSingular: 'Manche',
      roundPlural: 'Manches',
      drawTimer: 'Durée du Dessin',
      publicLeaderboardTitle: 'Classement Public',
      publicLeaderboardDesc: 'Les parties publiques comptent pour le classement mondial.',
      needPlayersHint: 'Il faut au moins 2 joueurs actifs pour démarrer. Partagez le lien !',
      playersReadySuffix: 'joueurs prêts à jouer.',
      startParty: 'Lancer la Partie',
      waitingForHost: 'En attente du lancement par l’hôte...',
      goAdFree: 'Sans Pub',
      yourTurnToDraw: 'À vous de dessiner',
      toPickSuffix: 's pour choisir',
      chooseSecretWord: 'Choisissez un mot secret',
      isChoosingWord: 'choisit un mot...',
      getReadyChat: 'Préparez-vous à taper vos réponses dans le chat !',
      drawLabel: 'Dessiner :',
      lettersLabel: 'lettres',
      isPickingWord: 'choisit un mot',
      questionOf: 'Question',
      roundOf: 'Manche',
      turnCompleteNext: 'Tour Terminé · Suite dans',
      theWordWas: 'Le mot était',
      answerLabel: 'Réponse :',
      removeAds: 'Retirer la Pub',
      continueNow: 'Continuer',
      finalPodium: 'Podium Final',
      takesTheCrown: 'remporte la couronne !',
      playAgain: 'Rejouer',
      waitingRematch: 'En attente d’une nouvelle partie...',
      guessesPartyChat: 'Devinettes & Chat',
      spectatingPlaceholder: 'Spectateur · Réactions ci-dessus',
      guessPlaceholder: 'Tapez votre réponse...',
      chatPlaceholder: 'Discuter avec le salon...',
      playersCountSuffix: 'joueurs',
      ofWord: 'sur',
      lockedInCount: 'ont répondu',
    },
    daily: {
      heading: 'Défi du Jour',
      sprintLabel: 'Sprint 5 Mots',
      rewardsMeta: 'Multiplicateur 1.5x · Badge du Jour · +250 pts',
      featuredPack: 'Thème vedette :',
      badgeUnlocked: 'Badge Actif · Points 1.5x',
      wordsPreview: 'Série du Jour',
      topFinishers: 'Plus Rapides Aujourd’hui',
      emptyFinishers: 'Soyez le premier à boucler les 5 mots du jour pour activer le bonus 1.5x.',
      startSprint: 'Lancer le Défi du Jour',
      replaySprint: 'Rejouer pour le Chrono',
      loadingChallenge: 'Chargement du défi...',
      wordProgress: 'Mot {current} sur {total}',
      drawPrefix: 'Dessiner :',
      strokeHint: 'Tracez au moins un trait sur la toile avant de continuer.',
      nextWord: 'Mot Suivant',
      finishChallenge: 'Débloquer Badge & 1.5x',
      submitting: 'Enregistrement...',
      submitError: 'Impossible d’enregistrer votre défi. Réessayez.',
      summaryTitle: 'Défi du Jour Réussi !',
      summaryBadgeActive: 'Votre Badge du Jour et le multiplicateur 1.5x en parties publiques sont actifs aujourd’hui.',
      bonusAwardedLabel: 'Bonus Classement',
      replayBonusNote: 'Déjà obtenu aujourd’hui',
      bestTimeLabel: 'Chrono Final',
      backToLobby: 'Retour à l’Accueil',
      badgeTooltip: 'Champion du Défi du Jour · Points 1.5x',
    },
    shortcuts: {
      title: 'Raccourcis Clavier',
      sendChat: 'Envoyer un message ou essai',
      focusChat: 'Activer la zone de chat',
      triviaOption: 'Choisir une réponse au quiz',
      pickWord: 'Choisir le mot secret (dessinateur)',
      undoStroke: 'Annuler le dernier trait',
      brushTools: 'Stylo / Surligneur / Remplir / Gomme',
      copyLink: 'Copier le lien d’invitation',
      toggleMute: 'Couper ou activer le son',
      toggleGuide: 'Ouvrir ou fermer les raccourcis',
      chatHint: 'Ctrl+Entrée envoyer · / chat · ? raccourcis',
    },
  },
  de: {
    common: {
      topPlayers: 'Bestenliste',
      wordPacks: 'Wortpakete',
      packs: 'Pakete',
      muteSound: 'Stummschalten',
      unmuteSound: 'Ton aktivieren',
      back: 'Zurück',
      close: 'Schließen',
      refresh: 'Aktualisieren',
      tryAgain: 'Erneut versuchen',
      dismiss: 'Ausblenden',
      publicLabel: 'Öffentlich',
      privateLabel: 'Privat',
      drawAndGuess: 'Zeichnen & Raten',
      triviaBlitz: 'Quiz-Blitz',
      youTag: '(Du)',
      pts: 'Pkt',
      languageLabel: 'Sprache',
    },
    title: {
      tagline: 'Zeichne schnell, rate Begriffe oder tritt im Quiz mit Freunden über einen Browser-Link an.',
      zeroDownloads: 'Ohne Download',
      activePack: 'Aktives Paket:',
      upToPlayers: 'Bis zu 12 Spieler',
      roomFullPrefix: 'Raum',
      roomFullSuffix: 'ist voll. Schau live zu und sende Reaktionen, bis ein Platz frei wird.',
      joinAsSpectator: 'Raum {code} als Zuschauer beitreten',
      yourNickname: 'Dein Spitzname',
      nicknamePlaceholder: 'Spitzname eingeben...',
      inkColor: 'Tintenfarbe',
      avatarHeading: 'Avatar-Studio',
      randomizeAvatar: 'Zufällig',
      tabColor: 'Farbe',
      tabShape: 'Form',
      tabEyes: 'Augen',
      tabMouth: 'Mund',
      tabGear: 'Extra',
      partyMode: 'Spielmodus',
      roomVisibility: 'Sichtbarkeit',
      publicRanked: 'Öffentlich (Rangliste)',
      joinRole: 'Beitreten als',
      playerRole: 'Spieler',
      spectatorRole: 'Zuschauer',
      roomCodePlaceholder: 'Raumcode',
      connecting: 'Verbinde...',
      spectateRoom: '{code} zusehen',
      joinRoom: 'Raum {code} beitreten',
      createPartyRoom: 'Partyraum erstellen',
      soloWarmup: 'Solo-Aufwärmen (1P)',
      browsePacks: 'Pakete & Pro-Pass',
      footerHint: 'Zeichnen mit Maus oder Touch · Enter zum Senden · Esc für Menü',
    },
    store: {
      heading: 'Wort- & Quiz-Pakete',
      subheading: 'Gratis-Pakete zeigen kurze Sponsorkarten zwischen den Runden. Schalte Pakete oder den Pro-Pass für werbefreie Räume frei.',
      proPassTag: 'Pro-Pass · Einmalig für Gastgeber',
      proPassTitle: 'Alle Premium-Pakete + Insider-Editor + Werbefreie Räume',
      proPassDesc: 'Freunde spielen kostenlos mit – nur der Gastgeber benötigt das Paket.',
      proPassActive: 'Pro-Pass aktiv',
      activateProPass: 'Pro-Pass aktivieren · 4,99 $',
      freePack: 'Gratis-Paket',
      creatorBuilder: 'Editor',
      premiumPack: 'Premium-Paket',
      wordsCount: 'Wörter',
      triviaCount: 'Quiz',
      sampleLabel: 'Beispiel:',
      selectedForRoom: 'Für Raum ausgewählt',
      useThisPack: 'Paket verwenden',
      unlockLabel: 'Freischalten',
      customTitle: 'Eigene Insider-Wörter',
      customDesc: 'Füge Spitznamen, Insider-Witze oder Campus-Orte hinzu (pro Zeile oder kommagetrennt).',
      requiresCustomPack: 'Erfordert Editor-Paket oder Pro-Pass',
      saveCustomWords: 'Speichern & verwenden',
      unlockedBanner: '„{title}“ für deine Räume freigeschaltet.',
      proPassBanner: 'Pro-Pass aktiviert: Alle Pakete und werbefreie Räume freigeschaltet.',
      customSavedBanner: '{count} eigene Wörter gespeichert.',
    },
    solo: {
      title: 'Solo-Zeichentraining',
      sketchedCount: 'gezeichnet',
      drawPrefix: 'Zeichne:',
      skipPrompt: 'Überspringen',
      doneNext: 'Fertig · Nächstes Wort',
    },
    canvas: {
      pen: 'Stift',
      mark: 'Marker',
      fill: 'Füllen',
      erase: 'Radierer',
      undo: 'Zurück',
      clear: 'Leeren',
      sizeSuffix: 'Größe',
    },
    leaderboard: {
      title: 'Bestenliste',
      subtitle: 'Top 10 nach Gesamtpunkten in öffentlichen Räumen. Wähle einen Spieler für den 7-Tage-Verlauf.',
      fetchError: 'Bestenliste konnte nicht geladen werden.',
      emptyTitle: 'Noch keine öffentlichen Punkte',
      emptyDesc: 'Starte einen öffentlichen Raum mit Freunden, um Platz 1 und die 7-Tage-Kurve freizuschalten.',
      growthSuffix: '7-Tage-Verlauf',
      totalLabel: 'Gesamt:',
      last7dSuffix: 'Pkt letzte 7T',
      totalTrend: 'Gesamttrend',
      dailyEarned: 'Pro Tag',
      earnedLabel: 'Erhalten:',
      rankCol: 'Rang',
      playerCol: 'Spieler',
      pointsCol: 'Gesamtpunkte',
      gameSingular: 'Spiel',
      gamePlural: 'Spiele',
      winSingular: 'Sieg',
      winPlural: 'Siege',
      place1: '1. Platz',
      place2: '2. Platz',
      place3: '3. Platz',
    },
    room: {
      copyInviteLink: 'Link kopieren',
      linkCopied: 'Link kopiert!',
      leaveRoom: 'Raum verlassen',
      streak: 'Serie',
      players: 'Spieler',
      spectators: 'Zuschauer',
      watching: 'Schaut zu',
      host: 'Host',
      drawing: 'Zeichnet',
      guessed: 'Erraten',
      lockedIn: 'Eingeloggt',
      spectatorModeBanner: 'Zuschauermodus · Live zusehen ohne Zug. Sende Reaktionen, während du wartest!',
      joinOpenSpot: 'Freien Platz einnehmen',
      roomFullLabel: 'Raum voll',
      partyLobby: 'Party-Lobby · Raum',
      lobbySubtitle: 'Teile diesen Link mit Freunden – kein Download nötig.',
      shareUrl: 'URL teilen',
      gameMode: 'Spielmodus',
      wordTriviaPack: 'Wort- & Quiz-Paket',
      packLanguage: 'Paketsprache',
      lockedStoreSuffix: '(Gesperrt - Shop)',
      storeBtn: 'Shop',
      rounds: 'Runden',
      roundSingular: 'Runde',
      roundPlural: 'Runden',
      drawTimer: 'Zeichenzeit',
      publicLeaderboardTitle: 'Öffentliche Rangliste',
      publicLeaderboardDesc: 'Öffentliche Spiele zählen für die globale Bestenliste.',
      needPlayersHint: 'Mindestens 2 aktive Spieler zum Starten nötig. Teile den Link!',
      playersReadySuffix: 'Spieler bereit.',
      startParty: 'Party starten',
      waitingForHost: 'Warte auf den Host zum Starten...',
      goAdFree: 'Werbefrei',
      yourTurnToDraw: 'Du bist mit Zeichnen dran',
      toPickSuffix: 's zum Wählen',
      chooseSecretWord: 'Wähle ein geheimes Wort',
      isChoosingWord: 'wählt ein Wort...',
      getReadyChat: 'Mach dich bereit, deine Tipps im Chat einzugeben!',
      drawLabel: 'Zeichne:',
      lettersLabel: 'Buchstaben',
      isPickingWord: 'wählt ein Wort',
      questionOf: 'Frage',
      roundOf: 'Runde',
      turnCompleteNext: 'Zug beendet · Weiter in',
      theWordWas: 'Das Wort war',
      answerLabel: 'Antwort:',
      removeAds: 'Werbung entfernen',
      continueNow: 'Jetzt weiter',
      finalPodium: 'Siegerpodest',
      takesTheCrown: 'holt die Krone!',
      playAgain: 'Nochmal spielen',
      waitingRematch: 'Warte auf Neustart durch Host...',
      guessesPartyChat: 'Tipps & Party-Chat',
      spectatingPlaceholder: 'Zuschauer · Reaktionen oben senden',
      guessPlaceholder: 'Tipp eingeben...',
      chatPlaceholder: 'Im Raum chatten...',
      playersCountSuffix: 'Spieler',
      ofWord: 'von',
      lockedInCount: 'bereit',
    },
    daily: {
      heading: 'Tages-Challenge',
      sprintLabel: '5-Wörter-Sprint',
      rewardsMeta: '1.5x Multiplikator · Tages-Abzeichen · +250 Pkt',
      featuredPack: 'Paket des Tages:',
      badgeUnlocked: 'Abzeichen aktiv · 1.5x Punkte',
      wordsPreview: 'Heutiges Wort-Set',
      topFinishers: 'Schnellste Spieler Heute',
      emptyFinishers: 'Schließe als Erster die 5 Wörter heute ab und aktiviere den 1.5x-Boost.',
      startSprint: 'Tages-Challenge starten',
      replaySprint: 'Für Bestzeit wiederholen',
      loadingChallenge: 'Lade Tages-Challenge...',
      wordProgress: 'Wort {current} von {total}',
      drawPrefix: 'Zeichne:',
      strokeHint: 'Zeichne mindestens einen Strich, bevor du fortfährst.',
      nextWord: 'Nächstes Wort',
      finishChallenge: 'Abzeichen & 1.5x sichern',
      submitting: 'Speichere...',
      submitError: 'Ergebnis konnte nicht gespeichert werden. Bitte erneut versuchen.',
      summaryTitle: 'Tages-Challenge geschafft!',
      summaryBadgeActive: 'Dein Tages-Abzeichen und der 1.5x-Punkte-Boost sind heute in öffentlichen Räumen aktiv.',
      bonusAwardedLabel: 'Bestenlisten-Bonus',
      replayBonusNote: 'Heute bereits erhalten',
      bestTimeLabel: 'Gesamtzeit',
      backToLobby: 'Zurück zur Lobby',
      badgeTooltip: 'Tages-Challenge-Champion · 1.5x Punkte',
    },
    shortcuts: {
      title: 'Tastaturkürzel im Raum',
      sendChat: 'Chat oder Tipp senden',
      focusChat: 'Chatfeld fokussieren',
      triviaOption: 'Quiz-Antwort wählen',
      pickWord: 'Geheimes Wort wählen (Zeichner)',
      undoStroke: 'Letzten Strich rückgängig machen',
      brushTools: 'Stift / Marker / Füllen / Radierer',
      copyLink: 'Einladungslink kopieren',
      toggleMute: 'Ton stummschalten',
      toggleGuide: 'Tastaturkürzel ein-/ausblenden',
      chatHint: 'Strg+Enter senden · / Chat · ? Kürzel',
    },
  },
};

export function getUIText(language: SupportedLanguage): UIStrings {
  return TRANSLATIONS[language] || TRANSLATIONS.en;
}
