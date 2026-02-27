# Piano di Implementazione: Premium Tab Animations

## Panoramica

Implementazione incrementale delle animazioni premium per la tab bar e le schermate dell'app. Si parte dal componente core `TabIconAnimator`, poi l'hook `useScreenIconAnimation`, l'integrazione nel layout tab, le animazioni per ogni schermata, e infine pulizia del codice e test.

## Tasks

- [x] 1. Creare il componente TabIconAnimator e le costanti di configurazione
  - [x] 1.1 Creare il file `components/common/TabIconAnimator.tsx` con l'interfaccia `TabIconAnimatorProps`, le costanti esportate `TAB_SPRING_CONFIG`, `TAB_CONFIG`, `ANIMATION_PARAMS` e il tipo `TabIconName`
    - Definire le costanti di configurazione spring (damping: 12, stiffness: 150, mass: 0.8) in un blocco documentato in cima al file
    - Definire `ANIMATION_PARAMS` con iconSize, activeScale, inactiveScale, activeOpacity, inactiveOpacity, bounceY, dotSize
    - Esportare `TAB_CONFIG` con la mappatura nome/titolo/icona per le 4 tab
    - Tipizzare tutte le props con interfacce TypeScript dedicate
    - _Requisiti: 7.2, 7.4, 7.5_

  - [x] 1.2 Implementare la logica di animazione del `TabIconAnimator` con shared values e `useAnimatedStyle`
    - Creare shared values per scale, opacity, translateY, dotScale, dotOpacity
    - Usare `useEffect` per reagire ai cambiamenti di `focused` e avviare le animazioni con `withSpring`
    - Implementare `useAnimatedStyle` per applicare le trasformazioni (scala, opacità, translateY) senza re-render
    - Gestire la transizione tra icona filled (focused=true) e outline (focused=false)
    - Valori target attivo: scale=1.0 (con overshoot ~1.15), opacity=1.0, translateY=-3→0, dotScale=1, dotOpacity=1
    - Valori target inattivo: scale=0.85, opacity=0.5, translateY=0, dotScale=0, dotOpacity=0
    - _Requisiti: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1-3.4, 3.5, 5.1, 5.4, 5.5_

  - [x] 1.3 Implementare l'indicatore dot animato sotto l'icona attiva
    - Renderizzare un dot di 4x4px con border-radius full e colore `theme.colors.primary`
    - Animare scala e opacità del dot in sincronia con le animazioni dell'icona
    - Usare `useAnimatedStyle` per il dot
    - _Requisiti: 4.1, 4.2, 4.3, 4.4, 8.1_

  - [x] 1.4 Integrare i colori e spacing del tema esistente nel componente
    - Usare `theme.colors.primary` per icona attiva e dot
    - Usare `theme.colors.muted` per icona inattiva
    - Usare `theme.spacing` per padding e margini
    - Usare `theme.fonts.medium` per le label
    - _Requisiti: 8.1, 8.2, 8.3, 8.4_

  - [ ]\* 1.5 Scrivere property test per i valori target dello stato attivo (Proprietà 1)
    - **Proprietà 1: Valori target dello stato attivo**
    - Generare tab random dalla configurazione, verificare che con focused=true i target siano scale=1.0, opacity=1.0, translateY=0, dotScale=1, dotOpacity=1
    - **Valida: Requisiti 1.1, 1.3, 2.1, 4.1**

  - [ ]\* 1.6 Scrivere property test per i valori target dello stato inattivo (Proprietà 2)
    - **Proprietà 2: Valori target dello stato inattivo**
    - Generare tab random dalla configurazione, verificare che con focused=false i target siano scale=0.85, opacity=0.5, translateY=0, dotScale=0, dotOpacity=0
    - **Valida: Requisiti 1.2, 1.4, 2.2, 4.2**

  - [ ]\* 1.7 Scrivere property test per il mapping icone filled/outline (Proprietà 3)
    - **Proprietà 3: Mapping icone filled/outline**
    - Generare nomi icona random dalla config e booleano focused, verificare che focused=true → nome base, focused=false → nome base + "-outline"
    - **Valida: Requisiti 3.1, 3.2, 3.3, 3.4**

  - [ ]\* 1.8 Scrivere unit test per il componente TabIconAnimator
    - Verificare che il dot abbia colore `theme.colors.primary` e dimensioni 4x4px con border-radius full
    - Verificare che il colore inattivo sia `theme.colors.muted`
    - Verificare che `TAB_SPRING_CONFIG` sia esportata correttamente
    - _Requisiti: 4.3, 4.4, 7.2, 8.1, 8.2_

- [x] 2. Aggiornare il layout tab per usare TabIconAnimator
  - [x] 2.1 Refactoring di `app/(tabs)/_layout.tsx` per importare e usare `TabIconAnimator`
    - Rimuovere la funzione `TabIcon` locale e il tipo `TabIconName` locale
    - Importare `TabIconAnimator`, `TAB_CONFIG` e `TAB_SPRING_CONFIG` dal nuovo componente
    - Delegare il rendering delle icone a `TabIconAnimator` nel `tabBarIcon`
    - Rimuovere stili inline non necessari e consolidarli in `StyleSheet.create()`
    - Mantenere la compatibilità con il feedback aptico esistente (`haptics.tabSwitch`)
    - _Requisiti: 7.1, 7.3, 7.4, 6.2, 6.3_

  - [x] 2.2 Configurare il padding platform-specific della tab bar
    - Padding iOS: 24px, Android: 8px (usando `Platform.OS`)
    - Mantenere le animazioni invariate tra piattaforme
    - _Requisiti: 6.1, 6.2_

  - [ ]\* 2.3 Scrivere unit test per il layout tab
    - Verificare padding iOS = 24px e Android = 8px
    - Verificare che le label usino `theme.fonts.medium`
    - _Requisiti: 6.2, 8.4_

- [x] 3. Checkpoint - Verificare che le animazioni della tab bar funzionino
  - Assicurarsi che tutti i test passino, chiedere all'utente se ci sono domande.

- [x] 4. Creare l'hook useScreenIconAnimation
  - [x] 4.1 Creare il file `hooks/useScreenIconAnimation.ts` con i tipi e l'interfaccia
    - Definire il tipo `AnimationType` con tutti i tipi di animazione: pulse, rotate, bounceY, slideX, spin, spinPartial, springScale, bounceDrop, clockwise
    - Definire `IconAnimationConfig` e `UseScreenIconAnimationOptions`
    - Definire `UseScreenIconAnimationReturn` con animatedStyles e replay
    - _Requisiti: 9.1-9.5, 10.1-10.3, 11.1-11.5, 12.1-12.5_

  - [x] 4.2 Implementare la logica core dell'hook con shared values e animazioni
    - Creare shared values (scale, opacity, translateY, translateX, rotate) per ogni icona configurata
    - Implementare la funzione `replay` che resetta i valori iniziali e avvia le animazioni con stagger delay
    - Implementare ogni tipo di animazione (pulse, rotate, bounceY, slideX, spin, spinPartial, springScale, bounceDrop, clockwise) con `withSpring`/`withTiming`/`withSequence`
    - Usare `useFocusEffect` di expo-router per rilevare il focus della tab e chiamare `replay`
    - Restituire array di `useAnimatedStyle` pronti per `Animated.View`
    - _Requisiti: 13.1, 13.2, 13.5_

  - [x] 4.3 Implementare la gestione del caricamento dati e il budget temporale
    - Accettare un parametro opzionale `isLoading` che blocca l'avvio delle animazioni
    - Quando `isLoading` passa da true a false, avviare le animazioni
    - Garantire che il ritardo dell'ultima icona + la sua durata non superi 800ms
    - _Requisiti: 13.3, 13.4_

  - [ ]\* 4.4 Scrivere property test per il calcolo del ritardo stagger (Proprietà 5)
    - **Proprietà 5: Calcolo del ritardo stagger**
    - Generare N icone e stagger delay S random, verificare che delay[i] = i \* S
    - **Valida: Requisiti 9.5, 10.3, 11.5, 12.5**

  - [ ]\* 4.5 Scrivere property test per il budget temporale totale (Proprietà 7)
    - **Proprietà 7: Budget temporale totale delle animazioni**
    - Generare configurazioni random di icone con durate e stagger, verificare che il totale ≤ 800ms
    - **Valida: Requisiti 13.3**

  - [ ]\* 4.6 Scrivere property test per il replay al re-focus (Proprietà 6)
    - **Proprietà 6: Replay delle animazioni al re-focus**
    - Generare sequenze di focus/unfocus, verificare che i shared values vengano resettati e le animazioni rieseguite
    - **Valida: Requisiti 13.1**

  - [ ]\* 4.7 Scrivere property test per le animazioni che attendono il caricamento (Proprietà 8)
    - **Proprietà 8: Animazioni attendono il completamento del caricamento**
    - Generare stati loading random, verificare che le animazioni non partano durante loading=true
    - **Valida: Requisiti 13.4**

- [x] 5. Checkpoint - Verificare hook e property test
  - Assicurarsi che tutti i test passino, chiedere all'utente se ci sono domande.

- [x] 6. Aggiungere le animazioni di ingresso alle schermate
  - [x] 6.1 Aggiungere le animazioni delle icone nella schermata Home (`app/(tabs)/index.tsx`)
    - Importare e configurare `useScreenIconAnimation` con 4 icone: play (pulse, 500ms), fitness (rotate, 400ms), flame (bounceY, 450ms), grid (slideX, 400ms)
    - Stagger delay: 80ms tra icone successive
    - Wrappare le icone target in `Animated.View` con gli animated styles restituiti dall'hook
    - _Requisiti: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 6.2 Aggiungere le animazioni delle icone nella schermata Library (`app/(tabs)/library.tsx`)
    - Importare e configurare `useScreenIconAnimation` con 2 icone: scan (spin, 500ms), add (spinPartial, 400ms)
    - Stagger delay: 100ms
    - Wrappare le icone target in `Animated.View` con gli animated styles
    - _Requisiti: 10.1, 10.2, 10.3_

  - [x] 6.3 Aggiungere le animazioni delle icone nella schermata Statistics (`app/(tabs)/progress.tsx`)
    - Importare e configurare `useScreenIconAnimation` con 4 icone: fitness (pulse/bounce, 500ms), flame (bounceY, 450ms), barbell (spin, 500ms), time (clockwise, 600ms)
    - Stagger delay: 80ms tra icone successive
    - Wrappare le icone target in `Animated.View` con gli animated styles
    - _Requisiti: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 6.4 Aggiungere le animazioni delle icone nella schermata Profile (`app/(tabs)/profile.tsx`)
    - Importare e configurare `useScreenIconAnimation` con 4 icone: barbell (springScale, 600ms), fitness (slideX, 400ms, delay 200ms), time (rotate, 400ms, delay 300ms), trophy (bounceDrop, 500ms, delay 400ms)
    - Stagger: icona hero a 0ms, feature row a partire da 200ms con stagger 100ms
    - Wrappare le icone target in `Animated.View` con gli animated styles
    - _Requisiti: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]\* 6.5 Scrivere unit test per le configurazioni di animazione delle schermate
    - Verificare che Home abbia 4 icone con i tipi e le durate corrette
    - Verificare che Library abbia 2 icone con i tipi e le durate corrette
    - Verificare che Statistics abbia 4 icone con i tipi e le durate corrette
    - Verificare che Profile abbia 4 icone con i tipi e le durate corrette
    - _Requisiti: 9.1-9.4, 10.1-10.2, 11.1-11.4, 12.1-12.4_

- [x] 7. Checkpoint - Verificare animazioni di tutte le schermate
  - Assicurarsi che tutti i test passino, chiedere all'utente se ci sono domande.

- [x] 8. Pulizia finale e property test di idempotenza
  - [x] 8.1 Pulizia del codice e rimozione di codice inutile dal layout tab
    - Rimuovere eventuali import non utilizzati
    - Verificare che non ci siano stili inline residui
    - Documentare le costanti di configurazione con commenti JSDoc
    - Verificare la coerenza dei nomi e delle interfacce TypeScript
    - _Requisiti: 7.1, 7.3, 7.4, 7.5_

  - [ ]\* 8.2 Scrivere property test per l'idempotenza dopo selezioni rapide (Proprietà 4)
    - **Proprietà 4: Idempotenza dello stato finale dopo selezioni rapide**
    - Generare sequenze random di cambi focus tra tab, verificare che lo stato finale corrisponda all'ultima tab selezionata come attiva
    - **Valida: Requisiti 5.5**

- [x] 9. Checkpoint finale - Verificare tutti i test e la qualità del codice
  - Assicurarsi che tutti i test passino, chiedere all'utente se ci sono domande.

## Note

- I task con `*` sono opzionali e possono essere saltati per un MVP più rapido
- Ogni task referenzia i requisiti specifici per tracciabilità
- I checkpoint garantiscono validazione incrementale
- I property test validano proprietà universali di correttezza
- Gli unit test validano esempi specifici e edge case
- Tutte le animazioni usano React Native Reanimated con esecuzione sul thread UI nativo
- I test usano Vitest con fast-check per i property-based test
