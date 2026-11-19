// Kembalikan konfigurasi filter sebelum perubahan (JS bundle dipulihkan terpisah)
const fs = require('fs');
const src = '/root/backups/genieacs-20261118/filter-contains/ui-filters-before.json';
const arr = eval(fs.readFileSync(src, 'utf8'));
if (!Array.isArray(arr) || arr.length < 20) throw new Error('Backup filter tidak valid');
const del = db.config.deleteMany({_id: /^ui\.filters/});
print('filter dihapus: ' + del.deletedCount);
arr.forEach(function (d) {
  db.config.updateOne({_id: d._id}, {$set: {value: d.value}}, {upsert: true});
});
print('filter dipulihkan: ' + arr.length);
