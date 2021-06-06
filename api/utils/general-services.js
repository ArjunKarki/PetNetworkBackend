

exports.generatePetId = () => {
    // Declare a digits variable  
    // which stores all digits 
    let ranText = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < 3; i++) {
        ranText += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    let digits = '0123456789';
    let ranNum = '-';
    for (let i = 0; i < 6; i++) {
        ranNum += digits[Math.floor(Math.random() * 10)];
    }
    return ranText.concat(ranNum)
}