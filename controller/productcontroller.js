import fs from "fs";
import path from "path";
import Property from "../models/propertymodel.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addproperty = async (req, res) => {
    console.log('Received request to add property, body:', req.body);
    console.log('Received files:', req.files ? Object.keys(req.files) : 'No files');
  
    try {
      const { title, description, price, location, propertyType, subtype, bhk, sqft, availability, phone } = req.body;
  
      console.log('Raw input data:', { title, description, price, location, propertyType, subtype, bhk, sqft, availability, phone });
  
      if (!title || !description || !price || !location || !propertyType || !subtype || !sqft || !availability || !phone) {
        throw new Error('Missing required fields');
      }
  
      const parsedPrice = parseInt(price, 10);
      const parsedSqft = parseInt(sqft, 10);
      if (isNaN(parsedPrice) || isNaN(parsedSqft)) {
        throw new Error('Price or SQFT must be valid numbers');
      }
  
      console.log('Parsed data:', { title, description, price: parsedPrice, location, propertyType, subtype, bhk, sqft: parsedSqft, availability, phone });
  
      const image1 = req.files?.image1?.[0];
      const image2 = req.files?.image2?.[0];
      const image3 = req.files?.image3?.[0];
      const image4 = req.files?.image4?.[0];
  
      const images = [image1, image2, image3, image4].filter((item) => item !== undefined);
      console.log('Filtered images:', images.map(img => img ? img.originalname : 'null'));
  
      const imageUrls = [];
      for (const item of images) {
        try {
          const newPath = path.join(__dirname, "../uploads", item.filename);
          console.log('Attempting to move file to:', newPath);
          if (!fs.existsSync(path.dirname(newPath))) {
            fs.mkdirSync(path.dirname(newPath), { recursive: true });
            console.log('Created uploads directory');
          }
          fs.renameSync(item.path, newPath);
          imageUrls.push(`/uploads/${item.filename}`);
          console.log('File moved successfully, URL:', `/uploads/${item.filename}`);
        } catch (fileError) {
          console.error('Error moving file:', fileError.message);
          throw fileError;
        }
      }
      console.log('Generated image URLs:', imageUrls);
  
      const product = new Property({
        title,
        description,
        price: parsedPrice,
        location,
        propertyType,
        subtype,
        bhk: ['Flat', 'House/Villa'].includes(subtype) ? bhk : undefined,
        sqft: parsedSqft,
        availability,
        image: imageUrls,
        phone
      });
      console.log('Created Property object:', product);
  
      await product.save();
      console.log('Property saved successfully to database');
  
      res.json({ message: "Product added successfully", success: true });
    } catch (error) {
      console.error('Error adding product:', error.message);
      console.error('Full error details:', error);
      if (error.name === 'ValidationError') {
        console.error('Validation errors:', error.errors);
      } else if (error.code === 'ENOENT') {
        console.error('File system error: Directory or file not found');
      }
      res.status(500).json({ message: "Server Error", success: false, error: error.message });
    }
  };
const listproperty = async (req, res) => {
  try {
    const property = await Property.find();
    res.json({ property, success: true });
  } catch (error) {
    console.log("Error listing products: ", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

const removeproperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.body.id);
    if (!property) {
      return res.status(404).json({ message: "Property not found", success: false });
    }
    property.image.forEach((imageUrl) => {
      const filePath = path.join(__dirname, "..", imageUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.log("Error deleting file: ", err);
      });
    });
    return res.json({ message: "Property removed successfully", success: true });
  } catch (error) {
    console.log("Error removing product: ", error);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};

const updateproperty = async (req, res) => {
  try {
    const { id, title, description, price, location, propertyType, subtype, bhk, sqft, availability, amenities, phone } = req.body;

    const property = await Property.findById(id);
    if (!property) {
      console.log("Property not found with ID:", id);
      return res.status(404).json({ message: "Property not found", success: false });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      property.title = title;
      property.description = description;
      property.price = price;
      property.location = location;
      property.propertyType = propertyType;
      property.subtype = subtype;
      property.bhk = ['Flat', 'House/Villa'].includes(subtype) ? bhk : undefined;
      property.sqft = sqft;
      property.availability = availability;
      property.amenities = amenities;
      property.phone = phone;
      await property.save();
      return res.json({ message: "Property updated successfully", success: true });
    }

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

    const imageUrls = images.map((item) => {
      const newPath = path.join(__dirname, "../uploads", item.filename);
      fs.renameSync(item.path, newPath);
      return `/uploads/${item.filename}`;
    });

    property.image.forEach((imageUrl) => {
      const filePath = path.join(__dirname, "..", imageUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.log("Error deleting old file: ", err);
      });
    });

    property.title = title;
    property.description = description;
    property.price = price;
    property.location = location;
    property.propertyType = propertyType;
    property.subtype = subtype;
    property.bhk = ['Flat', 'House/Villa'].includes(subtype) ? bhk : undefined;
    property.sqft = sqft;
    property.availability = availability;
    property.amenities = amenities;
    property.image = imageUrls;
    property.phone = phone;

    await property.save();
    res.json({ message: "Property updated successfully", success: true });
  } catch (error) {
    console.log("Error updating product: ", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

const singleproperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found", success: false });
    }
    res.json({ property, success: true });
  } catch (error) {
    console.log("Error fetching property:", error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

export { addproperty, listproperty, removeproperty, updateproperty, singleproperty };