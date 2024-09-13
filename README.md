# kor-case-law-search-engine
A Korean legal case search engine that offers semantic search, advanced query processing, and summarization.

## How to setup
- Set mysql and opensearch
- Set `src/config.json` appropriately. The example is at `src/config.json.example`.
- Install dependencies
  - `$pip install -r src/requirements.txt`
- Create database and table
  - `$cd src`
  - `$python setup_db_opensearch.py`

## How to run

### 1. Data collection
1. `$cd src`
2. `$python collect_cases.py`

### 2. Data processing
1. `$cd src`
2. `$python process_data.py`

### 3. Searching
1. `$cd src`
2. `$python search.py`

### 4. Running the backend server
1. `$cd backend`
2. `$python backend.py`

### 5. Running the frontend
1. `$cd frontend`
2. `$npm install`
3. `$npm start`

