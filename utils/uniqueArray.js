export default function uniqueArray(array, identifier = "id") {
    const uniqueArray = Array.from(new Set(array.map(a => a[identifier])))
        .map(id => {
            return array.find(a => a[identifier] === id)
        })
    return uniqueArray;
}