import express from 'express';
import bwipjs from 'bwip-js';

const router = express.Router();

router.get('/:code', async (req, res) => {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: req.params.code,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${req.params.code}.png"`,
    });
    res.send(png);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating barcode');
  }
});

export default router;
