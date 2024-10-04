// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const { exec } = require('child_process');
// const { PDFDocument, rgb } = require('pdf-lib');

// const app = express();
// const upload = multer({ dest: 'uploads/' });

// // Function to convert the file to PDF using LibreOffice
// const convertToPdf = (inputFilePath, callback) => {
//   const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'; // Update this with the path to LibreOffice on your machine
//   const outputDir = path.join(__dirname, 'uploads');

//   const command = `"${libreOfficePath}" --headless --convert-to pdf "${inputFilePath}" --outdir "${outputDir}"`;

//   exec(command, (error, stdout, stderr) => {
//     if (error) {
//       console.error(`Error during conversion: ${stderr}`);
//       callback(error, null);
//     } else {
//       console.log(`File converted to PDF: ${stdout}`);
//       const outputFileName = path.basename(inputFilePath, path.extname(inputFilePath)) + '.pdf';
//       const outputFilePath = path.join(outputDir, outputFileName);
//       callback(null, outputFilePath);
//     }
//   });
// };

// // Function to add a seal image to each page of the PDF
// const addSealToPdf = async (pdfPath, sealImagePath) => {
//   const existingPdfBytes = await fs.promises.readFile(pdfPath);
//   const pdfDoc = await PDFDocument.load(existingPdfBytes);
  
//   // Load the seal image
//   const sealImageBytes = await fs.promises.readFile(sealImagePath);
//   const sealImage = await pdfDoc.embedPng(sealImageBytes); // Use embedJpg for JPG images
//   const sealWidth = 50; // Adjust the size of the seal as needed
//   const sealHeight = 50; // Adjust the size of the seal as needed

//   // Add the seal to each page
//   const pages = pdfDoc.getPages();
//   pages.forEach(page => {
//     page.drawImage(sealImage, {
//       x: page.getWidth() - sealWidth - 10, // Positioning seal at bottom right
//       y: page.getHeight() - sealHeight - 10, // Positioning seal at bottom right
//       width: sealWidth,
//       height: sealHeight,
//     });
//   });

//   // Save the updated PDF
//   const pdfBytes = await pdfDoc.save();
//   await fs.promises.writeFile(pdfPath, pdfBytes); // Overwrite the original PDF
// };

// // API to upload a file and convert it to PDF
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const inputFilePath = req.file.path;
  
//   // Convert the uploaded file to PDF
//   convertToPdf(inputFilePath, async (error, result) => {
//     if (error) {
//       return res.status(500).send('Failed to convert file to PDF');
//     }

//     // Add the seal to the converted PDF
//     const sealImagePath = path.join(__dirname, 'seal.png'); // Update this with the path to your seal image
//     await addSealToPdf(result, sealImagePath);
    
//     // Send the converted PDF back to the user
//     res.send(`
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Converted PDF</title>
//       </head>
//       <body>
//           <h1>Converted PDF with Seal</h1>
//           <iframe src="/uploads/${path.basename(result)}" width="100%" height="600px"></iframe>
//           <p><a href="/uploads/${path.basename(result)}" download>Download PDF</a></p>
//       </body>
//       </html>
//     `);
//   });
// });

// // Serve the uploads directory as static files
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Start the server
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const libre = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Function to convert the file to PDF using libreoffice-convert
const convertToPdf = (inputFilePath) => {
  return new Promise((resolve, reject) => {
    const outputFilePath = path.join(__dirname, 'uploads', `${path.basename(inputFilePath, path.extname(inputFilePath))}.pdf`);
    
    // Read the input file
    const file = fs.readFileSync(inputFilePath);
    
    // Convert to PDF
    libre.convert(file, '.pdf', undefined, (err, result) => {
      if (err) {
        return reject(err);
      }
      // Write the PDF file to the output path
      fs.writeFileSync(outputFilePath, result);
      resolve(outputFilePath);
    });
  });
};

// Function to add a seal image to each page of the PDF
const addSealToPdf = async (pdfPath, sealImagePath) => {
  try {
    const existingPdfBytes = await fs.promises.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Load the seal image
    const sealImageBytes = await fs.promises.readFile(sealImagePath);
    const sealImage = await pdfDoc.embedPng(sealImageBytes); // Use embedJpg for JPG images
    const sealWidth = 50; // Adjust the size of the seal as needed
    const sealHeight = 50; // Adjust the size of the seal as needed

    // Add the seal to each page
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      page.drawImage(sealImage, {
        x: page.getWidth() - sealWidth - 10, // Positioning seal at bottom right
        y: page.getHeight() - sealHeight - 10, // Positioning seal at bottom right
        width: sealWidth,
        height: sealHeight,
      });
    });

    // Save the updated PDF
    const pdfBytes = await pdfDoc.save();
    await fs.promises.writeFile(pdfPath, pdfBytes); // Overwrite the original PDF
  } catch (error) {
    console.error(`Failed to add seal: ${error.message}`);
    throw error; // Rethrow to handle it in the calling function
  }
};

// API to upload a file and convert it to PDF
app.post('/upload', upload.single('file'), async (req, res) => {
  const inputFilePath = req.file.path;

  try {
    // Convert the uploaded file to PDF
    const outputFilePath = await convertToPdf(inputFilePath);

    // Add the seal to the converted PDF
    const sealImagePath = path.join(__dirname, 'seal.png'); // Update this with the path to your seal image
    await addSealToPdf(outputFilePath, sealImagePath);
    
    // Send the converted PDF back to the user
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Converted PDF</title>
      </head>
      <body>
          <h1>Converted PDF with Seal</h1>
          <iframe src="/uploads/${path.basename(outputFilePath)}" width="100%" height="600px"></iframe>
          <p><a href="/uploads/${path.basename(outputFilePath)}" download>Download PDF</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to process the file');
  }
});

// Serve the uploads directory as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
