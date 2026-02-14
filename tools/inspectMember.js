(async ()=>{
  try {
    const Member = require('../models/Member');
    const id = process.argv[2] || 4;
    const m = await Member.findById(Number(id));
    console.log(JSON.stringify(m, null, 2));
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
