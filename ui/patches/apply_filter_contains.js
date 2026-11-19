// Filter Product class: substring search (ketik "TO" -> TOTOLINK_*)
// Filter baru: ID (DeviceID.ID, substring search)
const S = (v) => "'" + v + "'";
const changes = [
  {_id: 'ui.filters.2.type', value: S('string-contains')},
  {_id: 'ui.filters.10.label', value: S('ID')},
  {_id: 'ui.filters.10.parameter', value: 'VirtualParameters.pppoeUsername2'},
  {_id: 'ui.filters.10.type', value: S('string-contains')}
];
changes.forEach(function (c) {
  const r = db.config.updateOne({_id: c._id}, {$set: {value: c.value}}, {upsert: true});
  print(c._id + ' = ' + c.value + ' (matched=' + r.matchedCount + ', modified=' + r.modifiedCount + ')');
});
