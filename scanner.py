import platform
import sys

def list_usb_devices_pyusb():
    try:
        import usb.core
        import usb.util
    except ImportError:
        print("The 'pyusb' module is required. Install it using 'pip install pyusb'")
        sys.exit(1)
    
    # Find all USB devices
    devices = usb.core.find(find_all=True)
    usb_devices = []
    
    for device in devices:
        device_info = {
            'Vendor ID': hex(device.idVendor),
            'Product ID': hex(device.idProduct),
            'Manufacturer': usb.util.get_string(device, device.iManufacturer) if device.iManufacturer else "N/A",
            'Product': usb.util.get_string(device, device.iProduct) if device.iProduct else "N/A",
            'Serial Number': usb.util.get_string(device, device.iSerialNumber) if device.iSerialNumber else "N/A"
        }
        usb_devices.append(device_info)
    
    return usb_devices

def list_usb_devices():
    current_os = platform.system()
    
    if current_os == "Windows":
        return list_usb_devices_windows()
    elif current_os == "Linux":
        return list_usb_devices_linux()
    elif current_os == "Darwin":
        return list_usb_devices_pyusb()
    else:
        print(f"Unsupported OS: {current_os}")
        return []

def list_usb_devices_windows():
    try:
        import wmi
    except ImportError:
        print("The 'wmi' module is required on Windows. Install it using 'pip install wmi'")
        sys.exit(1)
    
    c = wmi.WMI()
    usb_devices = []
    for usb in c.Win32_USBHub():
        device = {
            'DeviceID': usb.DeviceID,
            'PNPDeviceID': usb.PNPDeviceID,
            'Description': usb.Description
        }
        usb_devices.append(device)
    return usb_devices

def list_usb_devices_linux():
    try:
        # Use lsusb command
        result = subprocess.run(['lsusb'], stdout=subprocess.PIPE, text=True, check=True)
        devices = result.stdout.strip().split('\n')
        usb_devices = []
        for device in devices:
            usb_devices.append(device)
        return usb_devices
    except subprocess.CalledProcessError as e:
        print("Failed to run lsusb:", e)
        return []

def main():
    usb_devices = list_usb_devices()
    if not usb_devices:
        print("No USB devices found or unable to list devices.")
        return
    
    print("Connected USB Devices:")
    for idx, device in enumerate(usb_devices, start=1):
        print(f"\nDevice {idx}:")
        if isinstance(device, dict):
            for key, value in device.items():
                print(f"  {key}: {value}")
        else:
            print(f"  {device}")

if __name__ == "__main__":
    main()





# import platform
# import sys
# import subprocess

# def list_usb_devices_pyusb():
#     try:
#         import usb.core
#         import usb.util
#     except ImportError:
#         print("The 'pyusb' module is required. Install it using 'pip install pyusb'")
#         sys.exit(1)
    
#     # Find all USB devices
#     devices = usb.core.find(find_all=True)
#     usb_devices = []
    
#     for device in devices:
#         device_info = {
#             'Vendor ID': hex(device.idVendor),
#             'Product ID': hex(device.idProduct),
#             'Manufacturer': usb.util.get_string(device, device.iManufacturer) if device.iManufacturer else "N/A",
#             'Product': usb.util.get_string(device, device.iProduct) if device.iProduct else "N/A",
#             'Serial Number': usb.util.get_string(device, device.iSerialNumber) if device.iSerialNumber else "N/A"
#         }
#         usb_devices.append(device_info)
    
#     return usb_devices

# def list_usb_devices_windows():
#     try:
#         import wmi
#     except ImportError:
#         print("The 'wmi' module is required on Windows. Install it using 'pip install wmi'")
#         sys.exit(1)
    
#     c = wmi.WMI()
#     usb_devices = []
#     for usb in c.Win32_USBHub():
#         device = {
#             'DeviceID': usb.DeviceID,
#             'PNPDeviceID': usb.PNPDeviceID,
#             'Description': usb.Description
#         }
#         usb_devices.append(device)
#     return usb_devices

# def list_usb_devices_linux():
#     try:
#         # Use lsusb command
#         result = subprocess.run(['lsusb'], stdout=subprocess.PIPE, text=True, check=True)
#         devices = result.stdout.strip().split('\n')
#         usb_devices = []
#         for device in devices:
#             usb_devices.append(device)
#         return usb_devices
#     except subprocess.CalledProcessError as e:
#         print("Failed to run lsusb:", e)
#         return []

# def list_filtered_usb_devices(usb_devices, manufacturer_filter, product_filter):
#     """
#     Filters the USB devices based on Manufacturer and Product.

#     Parameters:
#         usb_devices (list): List of USB devices as dictionaries.
#         manufacturer_filter (str): Manufacturer name to filter.
#         product_filter (str): Product name to filter.

#     Returns:
#         list: Filtered list of devices with Vendor ID and Product ID.
#     """
#     filtered_devices = []
#     for device in usb_devices:
#         if (
#             device.get('Manufacturer', '').lower() == manufacturer_filter.lower() and
#             device.get('Product', '').lower() == product_filter.lower()
#         ):
#             filtered_devices.append({
#                 'Vendor ID': device.get('Vendor ID'),
#                 'Product ID': device.get('Product ID')
#             })
#     return filtered_devices

# def main():
#     usb_devices = list_usb_devices()
#     if not usb_devices:
#         print("No USB devices found or unable to list devices.")
#         return
    
#     # Define the filters
#     MANUFACTURER = "Adafruit Industries"
#     PRODUCT = "Feather M0"
    
#     # Filter devices based on Manufacturer and Product
#     filtered_devices = list_filtered_usb_devices(usb_devices, MANUFACTURER, PRODUCT)
    
#     if not filtered_devices:
#         print(f"No USB devices found with Manufacturer '{MANUFACTURER}' and Product '{PRODUCT}'.")
#         return
    
#     print(f"USB Devices with Manufacturer '{MANUFACTURER}' and Product '{PRODUCT}':")
#     for idx, device in enumerate(filtered_devices, start=1):
#         print(f"\nDevice {idx}:")
#         print(f"  Vendor ID: {device['Vendor ID']}")
#         print(f"  Product ID: {device['Product ID']}")

# def list_usb_devices():
#     current_os = platform.system()
    
#     if current_os == "Windows":
#         return list_usb_devices_windows()
#     elif current_os == "Linux":
#         return list_usb_devices_linux()
#     elif current_os == "Darwin":
#         return list_usb_devices_pyusb()
#     else:
#         print(f"Unsupported OS: {current_os}")
#         return []

# if __name__ == "__main__":
#     main()
