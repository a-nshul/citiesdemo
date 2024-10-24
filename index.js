const fs = require('fs');
const readline = require('readline');

// Utility function to read cities data from a CSV file
async function loadCitiesData(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const cities = [];
    
    for await (const line of rl) {
        const [cityCode, provinceCode, countryCode, cityName, provinceName, countryName] = line.split(',');
        cities.push({
            cityCode,
            provinceCode,
            countryCode,
            cityName,
            provinceName,
            countryName
        });
    }
    return cities;
}

// Class to handle the permissions of distributors
class Distributor {
    constructor(name, parentDistributor = null) {
        this.name = name;
        this.includes = [];
        this.excludes = [];
        this.parentDistributor = parentDistributor;
    }
    
    addInclude(region) {
        this.includes.push(region);
    }
    
    addExclude(region) {
        this.excludes.push(region);
    }
    
    // Check if the distributor has permission to distribute in a given city or region
    hasPermission(city) {
        // Check if the region is excluded
        if (this.excludes.some(exclude => this.matchRegion(city, exclude))) {
            return false;
        }
        // Check if the region is included
        if (this.includes.some(include => this.matchRegion(city, include))) {
            return true;
        }
        // Check the parent distributor's permissions if they exist
        if (this.parentDistributor) {
            return this.parentDistributor.hasPermission(city);
        }
        return false;
    }
    
    // Helper function to match regions (can match partial regions like state or country)
    matchRegion(city, region) {
        if (!city) return false;
        const cityParts = [
            city.cityName,
            city.provinceName,
            city.countryName
        ].map(part => part.toLowerCase().trim());
        
        const regionParts = region.split('-').map(part => part.toLowerCase().trim());
        
        // Compare parts of the city and region to check for matches
        return regionParts.every((part, index) => cityParts[index] === part);
    }
}

// Function to run a demo of distributor permission checks
async function runDemo() {
    const cities = await loadCitiesData('cities.csv');

    // Log the parsed cities for debugging
    console.log("Loaded Cities:", cities);

    // Example city lookups
    const chicago = cities.find(c => c.cityName.trim().toLowerCase() === 'chicago' && c.provinceName.trim().toLowerCase() === 'illinois' && c.countryName.trim().toLowerCase() === 'united states');
    const chennai = cities.find(c => c.cityName.trim().toLowerCase() === 'chennai' && c.provinceName.trim().toLowerCase() === 'tamil nadu' && c.countryName.trim().toLowerCase() === 'india');
    const bangalore = cities.find(c => c.cityName.trim().toLowerCase() === 'bangalore' && c.provinceName.trim().toLowerCase() === 'karnataka' && c.countryName.trim().toLowerCase() === 'india');
    const hubli = cities.find(c => c.cityName.trim().toLowerCase() === 'hubli' && c.provinceName.trim().toLowerCase() === 'karnataka' && c.countryName.trim().toLowerCase() === 'india');

    if (!chicago) console.log("Chicago not found");
    if (!chennai) console.log("Chennai not found");
    if (!bangalore) console.log("Bangalore not found");
    if (!hubli) console.log("Hubli not found");

    // Distributor 1 Permissions
    const distributor1 = new Distributor('DISTRIBUTOR1');
    distributor1.addInclude('india');
    distributor1.addInclude('unitedstates');
    distributor1.addExclude('karnataka-india');
    distributor1.addExclude('chennai-tamilnadu-india');
    
    // Distributor 2 Permissions (subset of DISTRIBUTOR1)
    const distributor2 = new Distributor('DISTRIBUTOR2', distributor1);
    distributor2.addInclude('india');
    distributor2.addExclude('tamilnadu-india');
    
    // Distributor 3 Permissions (subset of DISTRIBUTOR2)
    const distributor3 = new Distributor('DISTRIBUTOR3', distributor2);
    distributor3.addInclude('hubli-karnataka-india');
    
    // Checking permissions for DISTRIBUTOR1
    console.log(`DISTRIBUTOR1 can distribute in Chicago: ${distributor1.hasPermission(chicago)}`);  
    console.log(`DISTRIBUTOR1 can distribute in Chennai: ${distributor1.hasPermission(chennai)}`);  
    console.log(`DISTRIBUTOR1 can distribute in Bangalore: ${distributor1.hasPermission(bangalore)}`);  
    
    // Checking permissions for DISTRIBUTOR2
    console.log(`DISTRIBUTOR2 can distribute in Bangalore: ${distributor2.hasPermission(bangalore)}`);  
    console.log(`DISTRIBUTOR2 can distribute in Chennai: ${distributor2.hasPermission(chennai)}`);  
    
    // Checking permissions for DISTRIBUTOR3
    console.log(`DISTRIBUTOR3 can distribute in Hubli: ${distributor3.hasPermission(hubli)}`);  
}

// Run the demo
runDemo();


