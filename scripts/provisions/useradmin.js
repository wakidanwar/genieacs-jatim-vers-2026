// variable user dan password user admin
const user = "user";
const userpw = "<USER_PASSWORD>";

// variable user dan password super admin
// const superuser = "superadmin";
const superpw = "<SUPER_PASSWORD>";

const daily = Date.now(86400000);

declare("VirtualParameters.userAdmin", {value: daily}, {value: user});
declare("VirtualParameters.userPassword", {value: daily}, {value: userpw});

// superAdmin dinonaktifkan (superuser tidak didefinisikan)
// declare("VirtualParameters.superAdmin", {value: daily}, {value: superuser});
// declare("VirtualParameters.superPassword", {value: daily}, {value: superpw});
