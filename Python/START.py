# START.py 
#
# In order: Starts mqqt_server, Runs /src/main.py, Waits for "End", Ends mqqt server
#
import os
import subprocess
import sys
import time

class Color:
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def start_mosquitto():
    try:
        if sys.platform.startswith("win"):
            # Windows command to start Mosquitto
            mosquitto_command = ["mosquitto.exe"]
        else:
            # Unix-based command to start Mosquitto
            mosquitto_command = ["mosquitto"]

        # Start the Mosquitto server
        mosquitto_process = subprocess.Popen(mosquitto_command)
        print("\n" + Color.GREEN + "Mosquitto server started" + Color.RESET + "\n")
        return mosquitto_process
    except FileNotFoundError:
        print("Mosquitto is not installed or not in PATH")
        sys.exit(1)

def run_main_script():
    main_script_path = os.path.join(os.getcwd(), "src", "main.py")
    subprocess.run(["python3" if sys.platform != "win32" else "python", main_script_path, "-l"])

if __name__ == "__main__":
    # Start Mosquitto server
    mosquitto_process = start_mosquitto()
    time.sleep(2)  # Allow time for the server to initialize

    try:
        # Run main.py with the -l argument
        run_main_script()
        print("\n")
    finally:
        # Terminate Mosquitto server when done
        end_key = ""
        while end_key.lower().strip() != "end":
            end_key = input( Color.CYAN + "Enter \"end\" to stop the MQTT server: ")
            print(Color.RESET)

        mosquitto_process.terminate()
        print(Color.GREEN + "Mosquitto server stopped" + Color.RESET + "\n")
