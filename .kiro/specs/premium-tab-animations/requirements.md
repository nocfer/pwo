# Documento dei Requisiti

## Introduzione

Questa feature migliora l'esperienza di navigazione tra le tab dell'app Progressive Workout introducendo icone animate con effetto premium. Quando l'utente passa da una tab all'altra (Home, Library, Statistics, Profile), le icone della tab bar si animano in modo fluido e sofisticato utilizzando React Native Reanimated. Inoltre, le icone principali all'interno di ciascuna schermata si animano con effetti di ingresso diversificati quando la schermata viene visualizzata, creando un'esperienza visiva ricca e premium. La feature include anche una revisione e pulizia del codice esistente nel layout delle tab, rimuovendo codice inutile e migliorando la qualità complessiva.

## Glossario

- **Tab_Bar**: La barra di navigazione inferiore dell'app che contiene le icone e le etichette delle quattro sezioni principali
- **Tab_Icon_Animator**: Il componente che gestisce le animazioni delle icone nella Tab_Bar quando una tab viene selezionata o deselezionata
- **Icona_Attiva**: L'icona della tab attualmente selezionata dall'utente, visualizzata nella variante filled
- **Icona_Inattiva**: L'icona di una tab non selezionata, visualizzata nella variante outline
- **Animazione_di_Ingresso**: L'animazione che viene eseguita quando una tab diventa attiva (selezionata)
- **Animazione_di_Uscita**: L'animazione che viene eseguita quando una tab diventa inattiva (deselezionata)
- **Spring_Config**: La configurazione dei parametri dell'animazione spring (damping, stiffness, mass) utilizzata da React Native Reanimated
- **Tab_Home**: La tab principale dell'app che mostra la dashboard con i programmi e le sessioni recenti (icona: home)
- **Tab_Library**: La tab che mostra la libreria di esercizi e programmi (icona: library)
- **Tab_Statistics**: La tab che mostra le statistiche di progresso, heatmap e grafici (icona: stats-chart)
- **Tab_Profile**: La tab che mostra il profilo utente e le impostazioni (icona: person)
- **Icona_di_Schermata**: Un'icona principale visualizzata all'interno del contenuto di una schermata tab (non nella Tab_Bar), come le icone delle stat card, hero card o feature row
- **Animazione_di_Ingresso_Schermata**: L'animazione che viene eseguita sulle Icone_di_Schermata quando la schermata viene visualizzata o quando l'utente naviga verso di essa
- **Icona_Play_Home**: L'icona "play" nel pulsante hero Quick Start della Tab_Home
- **Icona_Fitness_Home**: L'icona "fitness" nella stat card dei workout completati della Tab_Home
- **Icona_Flame_Home**: L'icona "flame" nella stat card dello streak della Tab_Home
- **Icona_Grid_Home**: L'icona "grid-outline" nella card Browse Library della Tab_Home
- **Icona_Scan_Library**: L'icona "scan-outline" nel pulsante di scansione QR della Tab_Library
- **Icona_Add_Library**: L'icona "add" nel pulsante di creazione della Tab_Library
- **Icona_Fitness_Stats**: L'icona "fitness" nella stat card Total Workouts della Tab_Statistics
- **Icona_Flame_Stats**: L'icona "flame" nella stat card Current Streak della Tab_Statistics
- **Icona_Barbell_Stats**: L'icona "barbell" nella stat card Total Reps della Tab_Statistics
- **Icona_Time_Stats**: L'icona "time" nella stat card Active Workouts della Tab_Statistics
- **Icona_Barbell_Profile**: L'icona "barbell" nella hero card dell'app nella Tab_Profile
- **Icona_Fitness_Profile**: L'icona "fitness-outline" nella feature row Track Progress della Tab_Profile
- **Icona_Time_Profile**: L'icona "time-outline" nella feature row Guided Sessions della Tab_Profile
- **Icona_Trophy_Profile**: L'icona "trophy-outline" nella feature row Set Goals della Tab_Profile

## Requisiti

### Requisito 1: Animazione di scala e opacità alla selezione della tab

**User Story:** Come utente, voglio che le icone delle tab si animino con un effetto di scala e opacità quando seleziono una tab, così che la navigazione risulti fluida e premium.

#### Criteri di Accettazione

1. WHEN l'utente seleziona una tab, THE Tab_Icon_Animator SHALL eseguire un'Animazione_di_Ingresso con effetto spring che scala l'Icona_Attiva da 1.0 a un valore massimo (overshoot) e poi ritorna a 1.0
2. WHEN l'utente seleziona una tab diversa, THE Tab_Icon_Animator SHALL eseguire un'Animazione_di_Uscita sulla tab precedente che scala l'Icona_Inattiva da 1.0 a 0.85 con una transizione fluida
3. WHEN l'utente seleziona una tab, THE Tab_Icon_Animator SHALL animare l'opacità dell'Icona_Attiva da 0.5 a 1.0 durante l'Animazione_di_Ingresso
4. WHEN l'utente seleziona una tab diversa, THE Tab_Icon_Animator SHALL animare l'opacità dell'Icona_Inattiva da 1.0 a 0.5 durante l'Animazione_di_Uscita
5. THE Tab_Icon_Animator SHALL utilizzare animazioni spring di React Native Reanimated con Spring_Config configurabile per tutte le transizioni

### Requisito 2: Animazione di traslazione verticale (bounce)

**User Story:** Come utente, voglio che l'icona della tab selezionata abbia un leggero effetto bounce verticale, così che la selezione risulti tattile e reattiva.

#### Criteri di Accettazione

1. WHEN l'utente seleziona una tab, THE Tab_Icon_Animator SHALL eseguire una traslazione verticale (translateY) dell'Icona_Attiva verso l'alto di 3-4px con effetto spring e ritorno alla posizione originale
2. WHILE una tab è in stato inattivo, THE Tab_Icon_Animator SHALL mantenere l'Icona_Inattiva nella posizione verticale originale (translateY = 0)
3. THE Tab_Icon_Animator SHALL sincronizzare l'animazione di traslazione verticale con l'animazione di scala in modo che le due transizioni avvengano simultaneamente

### Requisito 3: Icone specifiche per ogni tab con varianti filled/outline

**User Story:** Come utente, voglio che ogni tab abbia un'icona riconoscibile che cambi tra variante filled (attiva) e outline (inattiva), così che lo stato di selezione sia immediatamente chiaro.

#### Criteri di Accettazione

1. THE Tab_Icon_Animator SHALL visualizzare l'icona "home" (filled) per la Tab_Home quando è attiva e "home-outline" quando è inattiva
2. THE Tab_Icon_Animator SHALL visualizzare l'icona "library" (filled) per la Tab_Library quando è attiva e "library-outline" quando è inattiva
3. THE Tab_Icon_Animator SHALL visualizzare l'icona "stats-chart" (filled) per la Tab_Statistics quando è attiva e "stats-chart-outline" quando è inattiva
4. THE Tab_Icon_Animator SHALL visualizzare l'icona "person" (filled) per la Tab_Profile quando è attiva e "person-outline" quando è inattiva
5. WHEN lo stato focused cambia, THE Tab_Icon_Animator SHALL eseguire la transizione tra variante filled e outline in sincronia con le animazioni di scala e opacità

### Requisito 4: Indicatore visivo della tab attiva

**User Story:** Come utente, voglio un indicatore visivo aggiuntivo (dot o barra) sotto l'icona della tab attiva, così che la tab selezionata sia ancora più evidente.

#### Criteri di Accettazione

1. WHEN una tab diventa attiva, THE Tab_Icon_Animator SHALL mostrare un indicatore dot sotto l'Icona_Attiva con un'animazione di scala da 0 a 1 e opacità da 0 a 1
2. WHEN una tab diventa inattiva, THE Tab_Icon_Animator SHALL nascondere l'indicatore dot con un'animazione di scala da 1 a 0 e opacità da 1 a 0
3. THE Tab_Icon_Animator SHALL colorare l'indicatore dot con il colore primary del tema (#6366F1)
4. THE Tab_Icon_Animator SHALL dimensionare l'indicatore dot con larghezza 4px e altezza 4px con border-radius full

### Requisito 5: Performance e fluidità delle animazioni

**User Story:** Come utente, voglio che le animazioni siano fluide e non causino rallentamenti, così che l'esperienza di navigazione rimanga reattiva.

#### Criteri di Accettazione

1. THE Tab_Icon_Animator SHALL eseguire tutte le animazioni sul thread UI nativo utilizzando le worklet di React Native Reanimated
2. THE Tab_Icon_Animator SHALL completare l'Animazione_di_Ingresso entro 400ms dal momento della selezione della tab
3. THE Tab_Icon_Animator SHALL completare l'Animazione_di_Uscita entro 300ms dal momento della deselezione della tab
4. THE Tab_Icon_Animator SHALL utilizzare useAnimatedStyle per applicare le trasformazioni senza causare re-render del componente React
5. IF l'utente seleziona rapidamente più tab in successione, THEN THE Tab_Icon_Animator SHALL interrompere le animazioni in corso e avviare immediatamente le nuove animazioni senza accumulo di stati intermedi

### Requisito 6: Compatibilità cross-platform

**User Story:** Come utente, voglio che le animazioni funzionino correttamente sia su iOS che su Android, così che l'esperienza sia consistente su entrambe le piattaforme.

#### Criteri di Accettazione

1. THE Tab_Icon_Animator SHALL renderizzare le animazioni in modo identico su iOS e Android
2. THE Tab_Icon_Animator SHALL adattare il padding della Tab_Bar in base alla piattaforma (24px su iOS, 8px su Android) mantenendo le animazioni invariate
3. THE Tab_Icon_Animator SHALL mantenere la compatibilità con il feedback aptico esistente (haptics.tabSwitch) durante le transizioni animate

### Requisito 7: Pulizia e refactoring del codice del layout tab

**User Story:** Come sviluppatore, voglio che il codice del layout delle tab sia pulito, ben organizzato e privo di codice inutile, così che sia facile da mantenere e estendere.

#### Criteri di Accettazione

1. THE Tab_Bar SHALL utilizzare un componente Tab_Icon_Animator dedicato e riutilizzabile estratto in un file separato nella directory components/
2. THE Tab_Bar SHALL definire la Spring_Config come costante esportabile per consentire la riutilizzabilità in altre animazioni dell'app
3. THE Tab_Bar SHALL rimuovere eventuali stili inline non necessari e consolidarli in StyleSheet.create()
4. THE Tab_Bar SHALL tipizzare correttamente tutte le props e i parametri utilizzando interfacce TypeScript dedicate
5. THE Tab_Bar SHALL organizzare le costanti di configurazione (TAB_CONFIG, dimensioni icone, parametri animazione) in un blocco separato e documentato in cima al file

### Requisito 8: Integrazione con il sistema di tema esistente

**User Story:** Come sviluppatore, voglio che le animazioni delle tab utilizzino i token del design system esistente, così che siano coerenti con il resto dell'app.

#### Criteri di Accettazione

1. THE Tab_Icon_Animator SHALL utilizzare theme.colors.primary per il colore dell'Icona_Attiva e dell'indicatore dot
2. THE Tab_Icon_Animator SHALL utilizzare theme.colors.muted per il colore dell'Icona_Inattiva
3. THE Tab_Icon_Animator SHALL utilizzare theme.spacing per tutti i valori di padding e margine nel layout della Tab_Bar
4. THE Tab_Icon_Animator SHALL utilizzare theme.fonts.medium per lo stile del testo delle etichette delle tab

### Requisito 9: Animazioni di ingresso delle icone principali nella schermata Home

**User Story:** Come utente, voglio che le icone principali nella schermata Home si animino con effetti diversificati quando la schermata viene visualizzata, così che l'esperienza risulti dinamica e premium.

#### Criteri di Accettazione

1. WHEN la Tab_Home viene visualizzata, THE Icona_Play_Home SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di pulsazione (scala da 0.0 a 1.15 e ritorno a 1.0) con durata di 500ms
2. WHEN la Tab_Home viene visualizzata, THE Icona_Fitness_Home SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di rotazione (da -90 gradi a 0 gradi) combinato con fade-in (opacità da 0 a 1) con durata di 400ms
3. WHEN la Tab_Home viene visualizzata, THE Icona_Flame_Home SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di bounce verticale (translateY da 20px a -4px a 0px) combinato con fade-in con durata di 450ms
4. WHEN la Tab_Home viene visualizzata, THE Icona_Grid_Home SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di slide-in orizzontale (translateX da -15px a 0px) combinato con fade-in con durata di 400ms
5. THE Tab_Home SHALL applicare un ritardo progressivo (stagger) di 80ms tra le Animazioni_di_Ingresso_Schermata delle icone successive per creare un effetto a cascata

### Requisito 10: Animazioni di ingresso delle icone principali nella schermata Library

**User Story:** Come utente, voglio che le icone dei pulsanti nella schermata Library si animino con effetti unici quando la schermata viene visualizzata, così che l'interazione risulti vivace.

#### Criteri di Accettazione

1. WHEN la Tab_Library viene visualizzata, THE Icona_Scan_Library SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di rotazione (da 0 a 360 gradi) combinato con scala (da 0.0 a 1.0) con durata di 500ms
2. WHEN la Tab_Library viene visualizzata, THE Icona_Add_Library SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di rotazione (da 0 a 90 gradi e ritorno a 0) combinato con scala (da 0.5 a 1.0) con durata di 400ms
3. THE Tab_Library SHALL applicare un ritardo di 100ms tra l'animazione della Icona_Scan_Library e quella della Icona_Add_Library

### Requisito 11: Animazioni di ingresso delle icone principali nella schermata Statistics

**User Story:** Come utente, voglio che le icone delle stat card nella schermata Statistics si animino ciascuna con un effetto diverso quando la schermata viene visualizzata, così che il dashboard risulti coinvolgente.

#### Criteri di Accettazione

1. WHEN la Tab_Statistics viene visualizzata, THE Icona_Fitness_Stats SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di bounce (scala da 0.0 a 1.2 a 0.95 a 1.0) con durata di 500ms
2. WHEN la Tab_Statistics viene visualizzata, THE Icona_Flame_Stats SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di oscillazione verticale (translateY da 15px a -3px a 0px) combinato con fade-in con durata di 450ms
3. WHEN la Tab_Statistics viene visualizzata, THE Icona_Barbell_Stats SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di rotazione (da -180 gradi a 0 gradi) combinato con scala (da 0.0 a 1.0) con durata di 500ms
4. WHEN la Tab_Statistics viene visualizzata, THE Icona_Time_Stats SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di rotazione oraria continua (da 0 a 360 gradi) con durata di 600ms e easing decelerante
5. THE Tab_Statistics SHALL applicare un ritardo progressivo (stagger) di 80ms tra le Animazioni_di_Ingresso_Schermata delle quattro icone stat per creare un effetto a cascata

### Requisito 12: Animazioni di ingresso delle icone principali nella schermata Profile

**User Story:** Come utente, voglio che le icone nella schermata Profile si animino con effetti eleganti quando la schermata viene visualizzata, così che il profilo risulti curato e premium.

#### Criteri di Accettazione

1. WHEN la Tab_Profile viene visualizzata, THE Icona_Barbell_Profile SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di scala spring (da 0.0 a 1.0) con overshoot pronunciato (scala massima 1.3) e durata di 600ms
2. WHEN la Tab_Profile viene visualizzata, THE Icona_Fitness_Profile SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di slide-in da sinistra (translateX da -20px a 0px) combinato con fade-in con durata di 400ms
3. WHEN la Tab_Profile viene visualizzata, THE Icona_Time_Profile SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di rotazione (da -90 gradi a 0 gradi) combinato con fade-in con durata di 400ms
4. WHEN la Tab_Profile viene visualizzata, THE Icona_Trophy_Profile SHALL eseguire un'Animazione_di_Ingresso_Schermata con effetto di bounce verticale (translateY da -20px a 3px a 0px) combinato con scala (da 0.5 a 1.0) con durata di 500ms
5. THE Tab_Profile SHALL applicare un ritardo progressivo (stagger) di 100ms tra l'Icona_Barbell_Profile e le tre icone delle feature row, con le feature row che iniziano 200ms dopo l'icona hero

### Requisito 13: Performance e riattivazione delle animazioni delle icone di schermata

**User Story:** Come utente, voglio che le animazioni delle icone di schermata siano fluide e si riattivino quando torno su una tab, così che l'effetto premium sia sempre presente.

#### Criteri di Accettazione

1. WHEN l'utente naviga verso una tab già visitata, THE Animazione_di_Ingresso_Schermata SHALL rieseguire le animazioni delle icone principali di quella schermata
2. THE Animazione_di_Ingresso_Schermata SHALL eseguire tutte le animazioni delle icone sul thread UI nativo utilizzando le worklet di React Native Reanimated
3. THE Animazione_di_Ingresso_Schermata SHALL completare tutte le animazioni delle icone di una schermata entro 800ms dal momento della visualizzazione della schermata (inclusi i ritardi stagger)
4. IF la schermata contiene dati in caricamento, THEN THE Animazione_di_Ingresso_Schermata SHALL attendere il completamento del caricamento prima di avviare le animazioni delle icone
5. THE Animazione_di_Ingresso_Schermata SHALL utilizzare animazioni spring di React Native Reanimated con parametri coerenti con la Spring_Config definita per le animazioni della Tab_Bar
