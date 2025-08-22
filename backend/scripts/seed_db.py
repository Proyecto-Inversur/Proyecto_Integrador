import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / 'src'))

from src.config.database import SessionLocal

if __name__ == '__main__':
    with SessionLocal() as session:
        # Add initial seeding logic here if necessary
        pass