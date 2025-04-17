# Sundlaugar Íslands REST API: Verkefnisskýrsla

## Inngangur

Þetta verkefni fól í sér að búa til alhliða REST API fyrir upplýsingar um sundlaugar á Íslandi. Vefþjónustan gerir notendum kleift að nálgast gögn um ýmsar sundlaugar, þar á meðal staðsetningu þeirra, aðstöðu og umsagnir notenda. Notendur geta einnig búið til aðgang, skrifað umsagnir og gefið einkunn til sundlauga. Næsta verkefni er að búa til framenda sem nýtir vefþjónustuna sem sumarverkefni til að gera til skemmtunar.

## Matskvarði fyrir verkefnið er:

- 20% Útfærsla á foo sem les gögn.
- 20% Útfærsla á bar sem les og leyfir að breyta, eyða og eyða gögnum.
- 20% Einingaprófanir á foo og bar.
- 20% Samþættingarprófanir (integration test) á foo og bar.
- 20% Vefþjónusta sett upp í hýsingu.

## Útfærsla

Vefþjónustan var útfærð með eftirfarandi lykileiginleikum:

### Gagnalíkön og tengsl
- **Sundlaugar**: Grunnupplýsingar um sundlaugar (nafn, staðsetning, gjöld o.s.frv.)
- **Aðstaða**: Aðstaða sem er í boði í hverri laug (heitir pottar, gufuböð, rennibrautir o.s.frv.)
- **Umsagnir**: Einkunnir og umsagnir notenda um sundlaugar
- **Notendur**: Notendareikningar með auðkenningu og heimildum

### Endapunktar
Vefþjónustan býður upp á nokkra endapunkta sem eru skipulagðir eftir tegund:

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

Verkefnið var útfært með eftirfarandi tækni:

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
- Railway fyrir hýsingu
- Stjórnun umhverfisbreyta
- Heilsutékk endapunktar fyrir eftirlit

## Hvað gekk vel

Nokkrir þættir verkefnisins gengu sérstaklega vel:

1. **Gagnalíkanagerð**: Tengsl milli sundlauga, aðstöðu, umsagna og notenda voru útfærð á hreinan hátt með viðeigandi takmörkunum á erlendum lyklum og keðjuðum eyðingum.

2. **Auðkenningarkerfi**: JWT auðkenningarkerfið veitir öruggan aðgang að vernduðum endapunktum á sama tíma og það viðheldur góðri notendaupplifun.

3. **Prófanir**: Eininga- og samþættingarprófanir veita framúrskarandi umfjöllun um virkni API-iðs. Alheimsuppsetning og niðurrif tryggja að hver prófun keyri með hreinu gagnagrunnsástandi.

4. **Skjölun**: Swagger skjölunin veitir yfirgripsmikla og gagnvirka leið fyrir notendur til að skilja og prófa API-ið.

5. **Staðfesting**: Staðfesting inntaks er ítarleg og veitir merkingarbær skilaboð til viðskiptavina.

6. **Útgáfa**: API-ið er sett upp á Railway með viðeigandi umhverfisstillingum og eftirliti með heilsu.

## Hvað gekk illa

Það komu upp nokkrar áskoranir í þróuninni:

1. **Uppsetning prófunargagnagrunns**: Upphaflega voru vandamál með uppsetningu prófunargagnagrunns, sérstaklega með tvíteknar töflur sem ollu takmörkunarbrotum. Þetta var leyst með því að útfæra rétta samstillingu gagnagrunns með `force: true` og bæta prófunararkitektúrinn.

2. **Auðkenningartilvik**: Að meðhöndla jaðartilvik í auðkenningu, eins og útrunnin token eða rangar beiðnir, krafðist viðbótarvillumeðhöndlunar og prófana.

3. **Sequelize tengsl**: Að fá keðjuð tengsl rétt milli líkana tók nokkrar tilraunir, sérstaklega fyrir eyðingu gagna með takmörkunum á erlendum lyklum.

4. **Umhverfisstillingar**: Að stjórna mismunandi umhverfisstillingum (þróun, prófun, framleiðsla) krafðist vandvirkrar uppsetningar og villuleitar.

5. **Takmörkun á beiðnum**: Að finna rétta jafnvægi fyrir takmörkun á beiðnum sem kemur í veg fyrir misnotkun án þess að hindra lögmæta notendur var áskorun.

## Hvað var áhugavert

Nokkrir þættir verkefnisins voru sérstaklega áhugaverðir:

1. **Öryggismynstur fyrir API**: Að útfæra réttar öryggisvenjur eins og JWT auðkenningu, dulkóðun lykilorða og aðgangsstýringu byggða á hlutverkum veitti dýrmæta innsýn í örugga hönnun API.

2. **Prófunaraðferðir**: Aðgreiningin á milli einingarprófana (með hermdum háðum einingum) og samþættingarprófana (með raunverulegum gagnagrunnsaðgerðum) sýndi mismunandi prófunaraðferðir og kosti þeirra.

3. **Swagger skjölun**: Að búa til gagnvirka API skjölun úr athugasemdum í kóða var glæsileg lausn sem tryggir að skjölun haldist í samræmi við útfærslu.

Í heildina veitti þetta verkefni yfirgripsmikla reynslu í hönnun, útfærslu, prófun og útgáfu á nútíma REST API með auðkenningu, sem er dýrmæt þekking fyrir framtíðarvefþróunarverkefni.