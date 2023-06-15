const axios = require("axios");
const launchesModel = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}
async function getAllLaunches(skip, limit) {
  return await launchesModel
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}
async function saveLaunch(launch) {
  await launchesModel.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber,
    },
    launch,
    {
      upsert: true,
    }
  );
}
const SPACEX_API_URL = `https://api.spacexdata.com/v4/launches/query`;

async function populateLaunches() {
  console.log("Loading launch data");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });
  if (response.status != 200) {
    console.log("Problem dowloading launch data");
    throw new Error("Launch data download failed");
  }
  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    const customers = payloads.flatMap((payload) => payload["customers"]);
    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers,
    };
    console.log(`${launch.flightNumber} : ${launch.mission}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already in database!!");
  } else {
    await populateLaunches();
  }
}
async function findLaunch(filter) {
  return await launchesModel.findOne(filter);
}
async function getLatestFlightNumber() {
  const latestLaunch = await launchesModel.findOne().sort("-flightNumber");
  if (!latestLaunch) return DEFAULT_FLIGHT_NUMBER;
  return latestLaunch.flightNumber;
}
async function scheduleNewLaunch(launch) {
  const planet = await planets.find({ keplerName: launch.target });
  if (planet.length == 0) throw new Error("No matching planet found");
  const newNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["ZTM", "NASA"],
    flightNumber: newNumber,
  });

  await saveLaunch(newLaunch);
}
// function addNewLaunch(launch) {
//   latestFLightNumber++;
//   launches.set(
//     latestFLightNumber,
//     Object.assign(launch, {
//       success: true,
//       upcoming: true,
//       customers: ["ZTM", "NASA"],
//       flightNumber: latestFLightNumber,
//     })
//   );
// }

async function abortLaunchById(launchId) {
  const aborted = await launchesModel.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.modifiedCount === 1;
}
module.exports = {
  getAllLaunches,
  existsLaunchWithId,
  abortLaunchById,
  scheduleNewLaunch,
  loadLaunchData,
};
