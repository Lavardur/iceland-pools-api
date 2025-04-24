# Sundlaugar Íslands REST API: Verkefnisskýrsla

## Inngangur

Þetta verkefni fól í sér að búa til alhliða REST API fyrir upplýsingar um sundlaugar á Íslandi. Vefþjónustan gerir notendum kleift að nálgast gögn um ýmsar sundlaugar, þar á meðal staðsetningu þeirra, aðstöðu og umsagnir notenda. Notendur geta einnig búið til aðgang, skrifað umsagnir og gefið einkunn til sundlauga. Ef ég myndi halda áfram með þetta verkefni þá myndi ég bæta við endursetningu á lykilorði, ég myndi gera það hægt að sía út gögn til að auðvelda notkun vefþjónustunnar og að lokum myndi ég vilja búa til framendann.

## Matskvarði fyrir verkefnið er:

- 20% Útfærsla á foo sem les gögn.
- 20% Útfærsla á bar sem les og leyfir að breyta, eyða og eyða gögnum.
- 20% Einingaprófanir á foo og bar.
- 20% Samþættingarprófanir (integration test) á foo og bar.
- 20% Vefþjónusta sett upp í hýsingu.

Með því að keyra öll test er hægt að staðfesta alla virkni. Annars er líka hægt að prófa endapunktanna með swagger skjöluninni.
Til að nota admin account: 
- email: 'admin@example.com',
- password: 'adminPassword123' 

## Útfærsla

### Gagnalíkön og tengsl
- **Sundlaugar**: Grunnupplýsingar um sundlaugar (nafn, staðsetning, gjöld o.s.frv.)
- **Aðstaða**: Aðstaða sem er í boði í hverri laug (heitir pottar, gufuböð, rennibrautir o.s.frv.)
- **Umsagnir**: Einkunnir og umsagnir notenda um sundlaugar
- **Notendur**: Notendareikningar með auðkenningu og heimildum

### Endapunktar

**Endapunktar fyrir sundlaugar:**
- `GET /api/pools`: Sækja allar sundlaugar með aðstöðu þeirra
- `GET /api/pools/:id`: Sækja upplýsingar um tiltekna laug með aðstöðu og umsögnum
- `GET /api/pools/:id/reviews`: Sækja allar umsagnir um tiltekna laug
- `POST /api/pools`: Bæta við nýrri laug (aðeins stjórnendur)
- `PUT /api/pools/:id`: Uppfæra upplýsingar um laug (aðeins stjórnendur)
- `DELETE /api/pools/:id`: Eyða laug (aðeins stjórnendur)

**Endapunktar fyrir umsagnir:**
- `POST /api/reviews`: Bæta við umsögn um laug (innskráðir notendur)
- `GET /api/users/reviews`: Sækja umsagnir eftir innskráðan notanda
- `DELETE /api/reviews/:id`: Eyða umsögn (aðeins eigandi eða stjórnandi)

**Endapunktar fyrir auðkenningu:**
- `POST /api/auth/register`: Búa til nýjan notendareikning
- `POST /api/auth/login`: Auðkenna og fá JWT token

**Kerfisendapunktar:**
- `GET /api/health`: Heilsutékk fyrir eftirlit
- `GET /api/docs`: Skjölun endapunkta

### Öryggi og staðfesting
- JWT auðkenning fyrir verndaða endapunkta
- Aðgangsstýring byggð á hlutverkum (stjórnendur vs. venjulegir notendur)
- Staðfesting inntaks með express-validator
- Lykilorð dulkóðuð með bcrypt
- Takmörkun á beiðnum til að koma í veg fyrir misnotkun

### Skjölun
- Gagnvirk Swagger UI skjölun aðgengileg í gegnum `/api/docs`
- Yfirgripsmiklar JSDoc athugasemdir fyrir alla endapunkta
- Skema fyrir öll gagnalíkön

## Tækni

**Bakendi:**
- Node.js með Express.js

**Gagnagrunnur:**
- PostgreSQL
- Sequelize ORM fyrir gagnalíkanagerð og fyrirspurnir

**Auðkenning og öryggi:**
- JSON Web Tokens (JWT) fyrir auðkenningu
- bcrypt fyrir dulkóðun lykilorða
- express-rate-limit fyrir takmörkun á beiðnum

**Staðfesting og gagnavinnsla:**
- express-validator fyrir staðfestingu inntaks
- cors þegar framendi fer að nota þjónustu

**Prófanir:**
- Jest fyrir prófanir
- Supertest fyrir HTTP staðhæfingar
- Cross-env fyrir umhverfisbreytur í prófunum

**Skjölun:**
- Swagger UI fyrir gagnvirka API skjölun
- swagger-jsdoc fyrir að búa til OpenAPI forskriftir

**Útgáfa:**
- Railway fyrir hýsingu gagnagrunns og vefþjónustu

## Hvað gekk vel

1. **Gagnalíkanagerð**: Tengsl milli sundlauga, aðstöðu, umsagna og notenda voru útfærð á hreinan hátt og engin vandamál áttu sér stað.

2. **Prófanir**: Eininga- og samþættingarprófanir veita framúrskarandi umfjöllun um virkni API-iðs. Alheimsuppsetning og niðurrif tryggja að hver prófun keyri með hreinu gagnagrunnsástandi.

3. **Skjölun**: Swagger skjölunin veitir yfirgripsmikla og gagnvirka leið fyrir notendur til að skilja og prófa Vefþjónustuna og það var mjög auðvelt að setja það upp.

4. **Útgáfa**: Vefþjónustan og gagnagrunnurinn var auðveldlega settur upp og það var létt að tengja þá saman þar sem þeir geta talað saman locally í Railway umhverfinu.

## Hvað gekk illa

1. **Uppsetning prófunargagnagrunns**: Upphaflega voru vandamál með uppsetningu prófunargagnagrunns, sérstaklega með tvíteknar töflur sem ollu takmörkunarbrotum. Þetta var leyst með því að útfæra rétta samstillingu gagnagrunns með `force: true` og bæta prófunararkitektúrinn.

2. **Umhverfisstillingar**: Að stjórna mismunandi umhverfisstillingum (þróun, prófun, framleiðsla) tók nokkrar tilraunir.

## Hvað var áhugavert

Nokkrir þættir verkefnisins voru sérstaklega áhugaverðir:

1. **Prófunaraðferðir**: Aðgreiningin á milli einingarprófana (með hermdum háðum einingum) og samþættingarprófana (með raunverulegum gagnagrunnsaðgerðum) sýndi mismunandi prófunaraðferðir og kosti þeirra.

2. **Swagger skjölun**: Að búa til gagnvirka API skjölun úr athugasemdum í kóða var glæsileg lausn sem tryggir að skjölun haldist í samræmi við útfærslu.
