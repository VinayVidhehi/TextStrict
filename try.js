const crypto = require('crypto');

crypto.generateKeyPair('rsa', {
  modulusLength: 4096, // Key size in bits
  publicExponent: 0x10001, // Public exponent
  publicKeyEncoding: {
    type: 'spki', // Recommended for public keys
    format: 'pem', // Encoding format
  },
  privateKeyEncoding: {
    type: 'pkcs8', // Recommended for private keys
    format: 'pem', // Encoding format
    cipher: 'aes-256-cbc', // Encryption algorithm
    passphrase: 'top secret', // Passphrase for encryption
  },
}, (err, publicKey, privateKey) => {
  if (err) {
    console.error('Error generating key pair', err);
  } else {
    console.log('Public Key:', publicKey);
    console.log('Private Key:', privateKey);
  }
});
