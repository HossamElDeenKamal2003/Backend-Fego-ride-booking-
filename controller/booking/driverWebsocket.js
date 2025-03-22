// const { updateLocation } = require("../booking/driverDest");
// const { findDrivers } = require('../booking/userBooking');

// //const { calculateDistance } = require("../utils/calculateDistance");
// function calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371e3; // Earth radius in meters
//     const φ1 = (lat1 * Math.PI) / 180;
//     const φ2 = (lat2 * Math.PI) / 180;
//     const Δφ = ((lat2 - lat1) * Math.PI) / 180;
//     const Δλ = ((lon2 - lon1) * Math.PI) / 180;

//     const a =
//         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//         Math.cos(φ1) * Math.cos(φ2) *
//         Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//     return R * c; // Distance in meters
// }
// const driverSocketHandler = (io) => {
//     const userSearches = new Map(); // Track user searches

//     io.on("connection", (socket) => {
//         console.log("A user connected");

//         socket.on("updateLocation", async (data) => {
//             const { driverId, longitude, latitude } = data;

//             if (!driverId || longitude === undefined || latitude === undefined) {
//                 socket.emit("error", { message: "Driver ID, longitude, and latitude are required" });
//                 return;
//             }

//             try {
//                 const updatedDriver = await updateLocation(driverId, longitude, latitude);
//                 socket.emit("driverLocationUpdated", updatedDriver);

//                 for (const [socketId, searchCriteria] of userSearches.entries()) {
//                     const { vehicleType, latitude: searchLat, longitude: searchLng } = searchCriteria;

//                     if (vehicleType === updatedDriver.vehicleType) {
//                         const distance = calculateDistance(searchLat, searchLng, latitude, longitude);

//                         if (distance <= 5000) {
//                             io.to(socketId).emit("matchingDriverFound", updatedDriver);
//                         }
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error updating location:", error);
//                 socket.emit("error", { message: error.message });
//             }
//         });

//         socket.on("findDrivers", async (data) => {
//             const { vehicleType, latitude, longitude } = data;
//             console.log(vehicleType, latitude, longitude);

//             userSearches.set(socket.id, { vehicleType, latitude, longitude });

//             try {
//                 const drivers = await findDrivers(vehicleType, latitude, longitude);

//                 if (drivers.length > 0) {
//                     socket.emit("driversFound", drivers);
//                 } else {
//                     socket.emit("noDriversFound", {
//                         message: "No drivers available in your area",
//                     });
//                 }
//             } catch (error) {
//                 console.log(error);
//                 socket.emit("error", { message: error.message });
//             }
//         });

//         socket.on("disconnect", () => {
//             console.log("A user disconnected");
//             userSearches.delete(socket.id); // Clean up user search data
//         });
//     });
// };

// module.exports = driverSocketHandler;
