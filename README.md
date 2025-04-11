# Iceland Swimming Pool Reviews 🏊♂️❄️

A website and REST API for reviewing/swimming pools in Iceland, featuring ratings, statistics, and crowdsourced data.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=)
[![API Status](https://img.shields.io/endpoint?url=https://iceland-pools-api-production.up.railway.app/api/health)]()

## Features
- **Pool Listings**: Name, location (GPS), entry fees, facilities
- **User Reviews**: 1-5 star ratings with comments
- **Statistics**: Top-rated pools, filter by amenities
- **Admin Tools**: Add/update pools (authenticated)

## Tech Stack
- **Backend**: Node.js, Express
- **Database**: PostgreSQL + Sequelize (ORM)
- **Deployment**: Railway (API + DB)
- **Frontend**: (To be implemented)

## Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/your-username/iceland-pools.git
   cd iceland-pools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/dbname
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. **Database setup**
   ```bash
   npx sequelize-cli db:migrate
   ```

## Configuration

### Environment Variables
| Variable        | Description                     |
|-----------------|---------------------------------|
| `DATABASE_URL`  | PostgreSQL connection URL       |
| `JWT_SECRET`    | Secret for authentication tokens|
| `PORT`          | API port (default: 3000)        |

## API Endpoints

| Method | Endpoint           | Description                   |
|--------|--------------------|-------------------------------|
| GET    | `/api/pools`       | List all pools                |
| POST   | `/api/pools`       | Add new pool (admin)          |
| GET    | `/api/pools/:id`   | Get pool details              |
| POST   | `/api/reviews`     | Submit review (authenticated) |

**Example Requests**:
```bash
# Get all pools
curl https://your-api.up.railway.app/api/pools

# Submit review
curl -X POST https://your-api.up.railway.app/api/reviews \
  -H "Content-Type: application/json" \
  -d '{"poolId": 1, "rating": 5, "comment": "Amazing hot tubs!"}'
```

## Deployment with Railway

1. **Create Railway account**  
   [Sign up here](https://railway.app)

2. **Create PostgreSQL database**  
   - Dashboard → New → Database → PostgreSQL
   - Copy `DATABASE_URL`

3. **Deploy API**  
   - Connect GitHub repo
   - Add environment variables:
     - `DATABASE_URL` (from step 2)
     - `JWT_SECRET` (generate a secure secret)

4. **Access live API**  
   Your API will be available at `https://project-name.up.railway.app`

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/foo`)
3. Commit changes (`git commit -am 'Add foo'`)
4. Push to branch (`git push origin feature/foo`)
5. Open a Pull Request

## License
MIT License - see [LICENSE](LICENSE)

## Contact
Your Name - your.email@example.com  
Project Link: [https://github.com/your-username/iceland-pools]()

---

**Acknowledgments**  
- Data sources: Visit Reykjavík, Sundlaugar.is  
- Hot spring photography: [Icelandic Tourism Board]()