try {
    const fs = require('fs');
    const vm = require('vm');
    const code = fs.readFileSync('../js/app.js', 'utf8');
    const script = new vm.Script(code);
    console.log("SYNTAX OK");
} catch(e) {
    const fs = require('fs');
    fs.writeFileSync('./syntax_error.txt', e.toString() + '\\n' + e.stack);
}
