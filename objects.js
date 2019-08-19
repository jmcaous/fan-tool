// this file contains the objects used for identifying solutions
// for a given room, set of candidate fans, and range of acceptable conditions
// defined by a addUser
//
// all objects store data in SI units (without prefixes)

/* object to represent the dimensions of a cuboid room */
function Room(ceilingHeight, sizeX, sizeY) {
  this.ceilingHeight = ceilingHeight;
  this.sizeX = sizeX;
  this.sizeY = sizeY;
  this.area = function() {
    return this.sizeX * this.sizeY;
  }
};

/* object to represent a candidate fan type */
function Fan(type, diameter, airflow, meetsUL507) {
  this.type = type;
  this.diameter = diameter;
  this.airflow = airflow;
  this.meetsUL507 = meetsUL507;
  this.fanAirSpeed = this.airflow/(Math.PI * Math.pow(this.diameter,2)/4);
};

/* Layout object represents a potential design layout
including the room characteristics and the number of fans */
function Layout(numFansX, numFansY, room){
  this.numFansX = numFansX;
  this.numFansY = numFansY;
  this.room = room;
  this.cellSizeX = this.room.sizeX / this.numFansX;
  this.cellSizeY = this.room.sizeY / this.numFansY;
  this.cellArea = this.cellSizeX * this.cellSizeY;
  this.r = Math.sqrt(this.cellArea);
  // TODO redefine throughout to always > 1
  this.aspectRatio = Math.max(this.cellSizeX/this.cellSizeY, this.cellSizeY/this.cellSizeX);
  this.numFans =  function(){
    return parseInt(this.numFansX * this.numFansY, 10);
  };
  this.validDiameters = function(){
    //returns valid diameter based on dimensionless diameter
    // and diameter constraints
    vds = [p.dimensionlessDiameter[0], p.dimensionlessDiameter[1]].map(n => n * this.r);
    maxDul507True = (this.room.ceilingHeight - 7)/0.2;
    maxDul507False = (this.room.ceilingHeight - 10)/0.2;
    if (vds[1] > maxDul507True) vds[1] = maxDul507True;
    if (vds[1] > 7 && vds[1] > maxDul507False) vds[1] = maxDul507False;
    if (vds[0] < p.diameter[0]) vds[0] = p.diameter[0];
    if (vds[0] > p.diameter[1]) vds[1] = p.diameter[1];
    return vds;
  }
}

/* Solution object represents a potential design solution
including the room, layout and fan characteristics */
function Solution(layout, fan){
  this.layout = layout;
  this.fan = fan;
  this.dr = this.fan.diameter/this.layout.r;
  this.cd = this.layout.room.ceilingHeight/this.fan.diameter;
  this.do = this.fan.diameter/1.7;
  this.hd = 2/this.fan.diameter;
  this.clearanceX = function(){
    return (this.layout.cellSizeX - this.fan.diameter) / 2;
  }
  this.clearanceY = function(){
    return (this.layout.cellSizeY - this.fan.diameter) / 2;
  }
  this.airspeeds = function(){
    lowest = this.fan.fanAirSpeed * (0.9 * this.dr - 0.017 * this.cd +0.11 * this.do + 1*0.024 + 0.047);
    areaWeightedAverage = this.fan.fanAirSpeed * (0.99 * this.dr - 0.06 * this.cd + 0.11 * this.do + 1*0.024 + 0.25);
    highest = this.fan.fanAirSpeed * (-0.18 * this.hd - 1*0.1 + 1.3);
    uniformity = 1 - ((highest-lowest)/highest);
    return [lowest,areaWeightedAverage,highest,uniformity];
  }
  this.validBladeHeightRange = function(){
    this.fan.meetsUL507 ? min = 7 : min = 10;
    max = this.layout.room.ceilingHeight - 0.2 * this.fan.diameter;
    return {'min' : min, 'max' : max,}
  }
}
