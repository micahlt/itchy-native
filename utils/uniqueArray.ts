export default function uniqueArray(
  array: Record<string, any>[],
  identifier: string = "id"
): Record<string, any>[] {
  const uniqueArray = Array.from(new Set(array.map((a) => a[identifier]))).map(
    (id) => {
      return array.find((a) => a[identifier] === id);
    }
  );
  return uniqueArray as Record<string, any>[];
}
