var moment = require("moment")

const getdays = async (date1,date2) => {
    console.log(date1,"is date")
    var start = moment(date1), // Sept. 1st
    end   = moment(date2).clone(), // Nov. 2nd
    day   = 0;                    // Sunday
    
var result = [];
var otherday=[]
var current = start.clone().subtract(1,'days');

while (current.add(1 , "day").isBefore(end)) {
    console.log(current.day())
    if(current.day() == 6) {
  result.push(current.clone());

        }
        else {
            otherday.push(current.clone())
        }
}
var obj = {'weekday':otherday.length,'weekend':result.length}

return obj;

}
// console.log(result.map(m => m.format('LLLL')));

module.exports = getdays