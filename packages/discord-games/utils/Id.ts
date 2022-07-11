const numbers = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
];

//Default length is 5 (e.g. 40814)

export function randomNumber() {
    const n = Math.floor(Math.random() * Math.floor(numbers.length - 1)) + 1;

    return numbers[n];
}

function createId(){
    return `${randomNumber()}${randomNumber()}${randomNumber()}${randomNumber()}${randomNumber()}`;
}

export function generateId(name?: string) {
    const Id = createId();
    if (name == null) {
        return `HORIZON_GAMING_${Id}`;
    } else {
        return `${Id}_${name}`;
    }
}