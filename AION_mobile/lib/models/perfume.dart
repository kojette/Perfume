class Perfume {
  final int id;
  final String name;

  Perfume({required this.id, required this.name});

  factory Perfume.fromJson(Map<String, dynamic> json) {
    return Perfume(
      id: json['id'],
      name: json['name'],
    );
  }
}