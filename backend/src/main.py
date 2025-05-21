import logging
import platform
import subprocess
from api.routes import app
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Synchronize clock on startup
def sync_clock():
    system = platform.system().lower()
    try:
        if system == 'linux':
            logger.info("Synchronizing clock with ntpdate on Linux")
            result = subprocess.run(['ntpdate', 'time.google.com'], capture_output=True, text=True, check=True)
            logger.info(f"Clock sync successful: {result.stdout}")
        elif system == 'windows':
            logger.info("Synchronizing clock with w32tm on Windows")
            # Check if Windows Time service is running
            service_check = subprocess.run(['sc', 'query', 'w32time'], capture_output=True, text=True)
            logger.info(f"Windows Time service status: {service_check.stdout}")
            if "RUNNING" not in service_check.stdout:
                logger.warning("Windows Time service is not running. Attempting to start...")
                subprocess.run(['net', 'start', 'w32time'], capture_output=True, text=True, check=True)
            result = subprocess.run(['w32tm', '/resync'], capture_output=True, text=True, check=True)
            logger.info(f"Clock sync successful: {result.stdout}")
        else:
            logger.warning(f"Unsupported platform for clock sync: {system}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Clock sync failed: {e.stderr or e.stdout or str(e)}")
    except FileNotFoundError as e:
        logger.error(f"Clock sync command not found: {str(e)}")
    except PermissionError as e:
        logger.error(f"Clock sync failed: Permission denied. Run with administrator privileges. {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during clock sync: {str(e)}")

# Run clock sync
sync_clock()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)