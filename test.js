function arraymove(arr, fromIndex, toIndex) {
  var element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}


let x = [1, 2, 3]

arraymove(x, 1, 0)

console.log(x)