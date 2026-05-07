class PickedLocation {
  final double latitude;
  final double longitude;
  final String address;

  const PickedLocation({
    required this.latitude,
    required this.longitude,
    required this.address,
  });

  Map<String, dynamic> toGeoPoint() => {
        'type': 'Point',
        'coordinates': [longitude, latitude],
        'addressLabel': address,
      };
}
