import math
from typing import Tuple

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth
    specified in decimal degrees (latitude, longitude).
    Returns distance in meters.
    """
    # Earth radius in meters
    R = 6371000.0

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (math.sin(delta_phi / 2.0) ** 2) + \
        math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    
    # Avoid numerical precision errors resulting in math domain errors
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return distance

def validate_geofence(
    device_lat: float, 
    device_lon: float, 
    office_lat: float, 
    office_lon: float, 
    radius_meters: float
) -> Tuple[bool, float]:
    """
    Validates if device is within the office radius.
    Returns: (is_within_radius, distance_in_meters)
    """
    distance = haversine_distance(device_lat, device_lon, office_lat, office_lon)
    is_valid = distance <= radius_meters
    return is_valid, round(distance, 2)
