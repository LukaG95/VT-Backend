const Moneyinfo = require("./Moneyinfo.json")
const Designinfo = require("./Designinfo.json")
const KACinfo = require("./KACinfo.json")
const CSGOinfo = require("./CSGOinfo.json")
const RLinfo = require("./infoRL.json")

exports.Categories = {
  ROCKET_LEAGUE: "Rocket League",
  MONEY: "Money",
  DESIGN: "Design",
  CSGO: "CSGO",
  KEYS_AND_CURRENCY: "Keys And Currency"
};

exports.CategoriesJson = {
  "Rocket League": RLinfo.items,
  "Money": Moneyinfo,
  "Design": Designinfo,
  "Keys And Currency": KACinfo,
  "CSGO": CSGOinfo
}

exports.CategoryFilters = {
  "Rocket League": {
    name: "",
    quality: "Any",
    type: "Any",
    platform: "Any"
  },

  "Money": {

  },

  "Design": {

  },

  "CSGO": {
    
  },

  "Keys And Currency": {

  }


}