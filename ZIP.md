# Zip file architecture reference

- File Entry\* (repeats)
  - Local Header (LOC)
    -
  - Encryption Header (ENC)\*
  - File Data
  - Data Descriptor (DES)
- Archive Decryption Header\*
- Archive Extra Data Record\*
- Central Directory Entry
  - Central Directory Header (repeats for each file entry)
- Zip64 End of Central Directory Record\*
- Zip64 End of Central Directory Locator\*
- End of Central Directory Record
  - Signature (0x06054b60) - 4 bytes
  - Disk Number - 2 bytes
  - Disk Number where the Central Directory Starts - 2 bytes
  - Number of entries in the Central Directory on this disk - 2 bytes
  - Number of entries in the Central Directory - 2 bytes
  - Size of the Central Directory - 4 bytes
  - Offset of the Central Directory - 4 bytes
  - Size of the comment - 2 bytes
  - Comment - n bytes (where n = Size of the comment)

_\* = Optional_
