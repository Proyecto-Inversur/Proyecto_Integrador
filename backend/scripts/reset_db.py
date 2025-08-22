import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / 'src'))

from src.api.models import Base
from src.config.database import engine

if __name__ == '__main__':
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)