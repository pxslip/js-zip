/* The local file header */
export const LOCHDR = 30; // LOC header size
export const LOCSIG = 0x04034b50; // "PK\003\004"
export const LOCVER = 4; // version needed to extract
export const LOCFLG = 6; // general purpose bit flag
export const LOCHOW = 8; // compression method
export const LOCTIM = 10; // modification time (2 bytes time;  2 bytes date)
export const LOCDAT = 12;
export const LOCCRC = 14; // uncompressed file crc-32 value
export const LOCSIZ = 18; // compressed size
export const LOCLEN = 22; // uncompressed size
export const LOCNAM = 26; // filename length
export const LOCEXT = 28; // extra field length
export const LOCEND = 30;

/* The Data descriptor */
export const EXTSIG = 0x08074b50; // "PK\007\008"
export const EXTHDR = 16; // EXT header size
export const EXTCRC = 4; // uncompressed file crc-32 value
export const EXTSIZ = 8; // compressed size
export const EXTLEN = 12; // uncompressed size

/* The central directory file header */
export const CENHDR = 46; // CEN header size
export const CENSIG = 0x02014b50; // "PK\001\002"
export const CENVEM = 4; // version made by
export const CENVER = 6; // version needed to extract
export const CENFLG = 8; // encrypt;  decrypt flags
export const CENHOW = 10; // compression method
export const CENTIM = 12; // modification time (2 bytes time;  2 bytes date)
export const CENCRC = 16; // uncompressed file crc-32 value
export const CENSIZ = 20; // compressed size
export const CENLEN = 24; // uncompressed size
export const CENNAM = 28; // filename length
export const CENEXT = 30; // extra field length
export const CENCOM = 32; // file comment length
export const CENDSK = 34; // volume number start
export const CENATT = 36; // internal file attributes
export const CENATX = 38; // external file attributes (host system dependent)
export const CENOFF = 42; // LOC header offset

/* The entries in the end of central directory */
export const ENDHDR = 22; // END header size
export const ENDSIG = 0x06054b50; // "PK\005\006"
export const ENDSUB = 8; // number of entries on this disk
export const ENDTOT = 10; // total number of entries
export const ENDSIZ = 12; // central directory size in bytes
export const ENDOFF = 16; // offset of first CEN header
export const ENDCOM = 20; // zip file comment length

export const END64HDR = 20; // zip64 END header size
export const END64SIG = 0x07064b50; // zip64 Locator signature;  "PK\006\007"
export const END64START = 4; // number of the disk with the start of the zip64
export const END64OFF = 8; // relative offset of the zip64 end of central directory
export const END64NUMDISKS = 16; // total number of disks

export const ZIP64SIG = 0x06064b50; // zip64 signature;  "PK\006\006"
export const ZIP64HDR = 56; // zip64 record minimum size
export const ZIP64LEAD = 12; // leading bytes at the start of the record;  not counted by the value stored in ZIP64SIZE
export const ZIP64SIZE = 4; // zip64 size of the central directory record
export const ZIP64VEM = 12; // zip64 version made by
export const ZIP64VER = 14; // zip64 version needed to extract
export const ZIP64DSK = 16; // zip64 number of this disk
export const ZIP64DSKDIR = 20; // number of the disk with the start of the record directory
export const ZIP64SUB = 24; // number of entries on this disk
export const ZIP64TOT = 32; // total number of entries
export const ZIP64SIZB = 40; // zip64 central directory size in bytes
export const ZIP64OFF = 48; // offset of start of central directory with respect to the starting disk number
export const ZIP64EXTRA = 56; // extensible data sector

/* Compression methods */
export const STORED = 0; // no compression
export const SHRUNK = 1; // shrunk
export const REDUCED1 = 2; // reduced with compression factor 1
export const REDUCED2 = 3; // reduced with compression factor 2
export const REDUCED3 = 4; // reduced with compression factor 3
export const REDUCED4 = 5; // reduced with compression factor 4
export const IMPLODED = 6; // imploded
// 7 reserved for Tokenizing compression algorithm
export const DEFLATED = 8; // deflated
export const ENHANCED_DEFLATED = 9; // enhanced deflated
export const PKWARE = 10; // PKWare DCL imploded
// 11 reserved by PKWARE
export const BZIP2 = 12; //  compressed using BZIP2
// 13 reserved by PKWARE
export const LZMA = 14; // LZMA
// 15-17 reserved by PKWARE
export const IBM_TERSE = 18; // compressed using IBM TERSE
export const IBM_LZ77 = 19; // IBM LZ77 z
export const AES_ENCRYPT = 99; // WinZIP AES encryption method

/* General purpose bit flag */
// values can obtained with expression 2**bitnr
export const FLG_ENC = 1; // Bit 0: encrypted file
export const FLG_COMP1 = 2; // Bit 1;  compression option
export const FLG_COMP2 = 4; // Bit 2;  compression option
export const FLG_DESC = 8; // Bit 3;  data descriptor
export const FLG_ENH = 16; // Bit 4;  enhanced deflating
export const FLG_PATCH = 32; // Bit 5;  indicates that the file is compressed patched data.
export const FLG_STR = 64; // Bit 6;  strong encryption (patented)
// Bits 7-10: Currently unused.
export const FLG_EFS = 2048; // Bit 11: Language encoding flag (EFS)
// Bit 12: Reserved by PKWARE for enhanced compression.
// Bit 13: encrypted the Central Directory (patented).
// Bits 14-15: Reserved by PKWARE.
export const FLG_MSK = 4096; // mask header values

/* Load type */
export const FILE = 2;
export const BUFFER = 1;
export const NONE = 0;

/* 4.5 Extensible data fields */
export const EF_ID = 0;
export const EF_SIZE = 2;

/* Header IDs */
export const ID_ZIP64 = 0x0001;
export const ID_AVINFO = 0x0007;
export const ID_PFS = 0x0008;
export const ID_OS2 = 0x0009;
export const ID_NTFS = 0x000a;
export const ID_OPENVMS = 0x000c;
export const ID_UNIX = 0x000d;
export const ID_FORK = 0x000e;
export const ID_PATCH = 0x000f;
export const ID_X509_PKCS7 = 0x0014;
export const ID_X509_CERTID_F = 0x0015;
export const ID_X509_CERTID_C = 0x0016;
export const ID_STRONGENC = 0x0017;
export const ID_RECORD_MGT = 0x0018;
export const ID_X509_PKCS7_RL = 0x0019;
export const ID_IBM1 = 0x0065;
export const ID_IBM2 = 0x0066;
export const ID_POSZIP = 0x4690;

export const EF_ZIP64_OR_32 = 0xffffffff;
export const EF_ZIP64_OR_16 = 0xffff;
export const EF_ZIP64_SUNCOMP = 0;
export const EF_ZIP64_SCOMP = 8;
export const EF_ZIP64_RHO = 16;
export const EF_ZIP64_DSN = 24;

export function methodToString(method: number) {
	switch (method) {
		case STORED:
			return 'STORED (' + method + ')';
		case DEFLATED:
			return 'DEFLATED (' + method + ')';
		default:
			return 'UNSUPPORTED (' + method + ')';
	}
}
