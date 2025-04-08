import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  propertyType: { 
    type: String, 
    required: true, 
    enum: ['Commercial', 'Residential', 'Land', 'Rental'] 
  },
  subtype: { 
    type: String, 
    required: true,
    enum: [
      'Office/Space', 'Shop/Showroom', 'Commercial Land', 'Warehouse/Godown', 
      'Industrial Building', 'Industrial Shed', 'Flat', 'House/Villa', 'Plot', 
      'Agricultural Land'
    ]
  },
  bhk: { 
    type: String, 
    enum: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5 BHK', '5+ BHK'],
    required: function() { return ['Flat', 'House/Villa'].includes(this.subtype); }
  },
  sqft: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 10000 
  },
  availability: { 
    type: String, 
    required: true, 
    enum: ['buy', 'sell'] 
  },
  image: { type: [String], required: true },
  phone: { type: String, required: true }, // Phone remains
});

const Property = mongoose.model("Property", propertySchema);

export default Property;