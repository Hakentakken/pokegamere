/* VCDIFF module for RomPatcher.js v20181021 - Marc Robledo 2018 - http://www.marcrobledo.com/license */
/* File format specification: https://tools.ietf.org/html/rfc3284 */
/*
	Mostly based in:
	https://github.com/vic-alexiev/TelerikAcademy/tree/master/C%23%20Fundamentals%20II/Homework%20Assignments/3.%20Methods/000.%20MiscUtil/Compression/Vcdiff
	some code and ideas borrowed from:
	https://hack64.net/jscripts/libpatch.js?6
*/
//const VCDIFF_MAGIC=0xd6c3c400;
const VCDIFF_MAGIC='\xd6\xc3\xc4';
/*
const XDELTA_014_MAGIC='%XDELTA';
const XDELTA_018_MAGIC='%XDZ000';
const XDELTA_020_MAGIC='%XDZ001';
const XDELTA_100_MAGIC='%XDZ002';
const XDELTA_104_MAGIC='%XDZ003';
const XDELTA_110_MAGIC='%XDZ004';
*/
if(typeof module !== "undefined" && module.exports){
	module.exports = VCDIFF;
	BinFile = require("./BinFile");
	VCDIFF_LZMA_Stream = require("./RomPatcher.secondary.lzma");
}

function VCDIFF(patchFile){
	this.file=patchFile;
}
VCDIFF.prototype.toString=function(){
	return 'VCDIFF patch'
}

VCDIFF.prototype.apply=function(romFile, validate){
	//romFile._u8array=new Uint8Array(romFile._dataView.buffer);

	//var t0=performance.now();
	var parser=new VCDIFF_Parser(this.file);

	//read header
	parser.seek(4);
	var headerIndicator=parser.readU8();

	var lzmaSecondaryStreams=null;
	if(headerIndicator & VCD_DECOMPRESS){
		//has secondary decompressor, read its id
		var secondaryDecompressorId=parser.readU8();

		if(secondaryDecompressorId===VCD_LZMA_ID){
			//xdelta3's LZMA secondary compressor (its default when built with
			//liblzma). One persistent xz/LZMA2 decoder per section type for the
			//whole apply pass, mirroring xdelta3's xd3_get_secondary
			lzmaSecondaryStreams=[new VCDIFF_LZMA_Stream(), new VCDIFF_LZMA_Stream(), new VCDIFF_LZMA_Stream()];
		}else if(secondaryDecompressorId!==0){
			throw new Error('not implemented: secondary decompressor '+secondaryDecompressorId);
		}
	}


	if(headerIndicator & VCD_CODETABLE){
		var codeTableDataLength=parser.read7BitEncodedInt();

		if(codeTableDataLength!==0)
			throw new Error('not implemented: custom code table'); // custom code table
	}

	if(headerIndicator & VCD_APPHEADER){
		// ignore app header data
		var appDataLength=parser.read7BitEncodedInt();
		parser.skip(appDataLength);
	}
	var headerEndOffset=parser.offset;

	//calculate target file size
	var newFileSize=0;
	while(!parser.isEOF()){
		var winHeader=parser.decodeWindowHeader();
		newFileSize+=winHeader.targetWindowLength;
		parser.skip(winHeader.addRunDataLength + winHeader.addressesLength + winHeader.instructionsLength);
	}
	tempFile=new BinFile(newFileSize);




	parser.seek(headerEndOffset);



	var cache = new VCD_AdressCache(4,3);
	var codeTable = VCD_DEFAULT_CODE_TABLE;

	var targetWindowPosition = 0; //renombrar

	while(!parser.isEOF()){
		var winHeader = parser.decodeWindowHeader();

		//section offsets/lengths as stored in the patch (compressed lengths)
		var addRunDataSectionEnd = parser.offset + winHeader.addRunDataLength;
		var instructionsSectionEnd = addRunDataSectionEnd + winHeader.instructionsLength;
		var addressesSectionEnd = instructionsSectionEnd + winHeader.addressesLength;

		var addRunDataStream = new VCDIFF_Parser(this.file, parser.offset);
		var instructionsStream = new VCDIFF_Parser(this.file, addRunDataSectionEnd);
		var addressesStream = new VCDIFF_Parser(this.file, instructionsSectionEnd);
		var instructionsStreamEndOffset = instructionsSectionEnd;

		if(winHeader.deltaIndicator!==0){
			//secondary compression: every marked section starts with the 7-bit
			//uncompressed size, followed by its compressed xz/LZMA2 bytes
			if(lzmaSecondaryStreams===null)
				throw new Error('invalid VCDIFF patch: compressed section without a secondary decompressor');

			var sectionStreams=[addRunDataStream, instructionsStream, addressesStream];
			var sectionCompFlags=[VCD_DATACOMP, VCD_INSTCOMP, VCD_ADDRCOMP];
			var sectionEnds=[addRunDataSectionEnd, instructionsSectionEnd, addressesSectionEnd];

			for(var s=0; s<3; s++){
				if(!(winHeader.deltaIndicator & sectionCompFlags[s]))
					continue;

				var sectionSize=sectionStreams[s].read7BitEncodedInt();
				var sectionStart=sectionStreams[s].offset;
				var compressedBytes=new Uint8Array(sectionEnds[s]-sectionStart);
				compressedBytes.set(this.file._u8array.subarray(sectionStart, sectionEnds[s]));

				var decompressedBytes=lzmaSecondaryStreams[s].feed(compressedBytes, sectionSize);
				if(decompressedBytes.length!==sectionSize)
					throw new Error('truncated xz secondary stream ('+decompressedBytes.length+' of '+sectionSize+' bytes decoded)');
				sectionStreams[s]=new VCDIFF_Parser(new BinFile(decompressedBytes), 0);

				if(s===1)
					instructionsStreamEndOffset=sectionSize;
			}

			addRunDataStream=sectionStreams[0];
			instructionsStream=sectionStreams[1];
			addressesStream=sectionStreams[2];
		}

		var addRunDataIndex = 0;

		cache.reset(addressesStream);

		while(instructionsStream.offset<instructionsStreamEndOffset){
			/*
			var instructionIndex=instructionsStream.readS8();
			if(instructionIndex===-1){
				break;
			}
			*/
			var instructionIndex = instructionsStream.readU8();


			for(var i=0; i<2; i++){
				var instruction=codeTable[instructionIndex][i];
				var size=instruction.size;

				if(size===0 && instruction.type!==VCD_NOOP){
					size=instructionsStream.read7BitEncodedInt()
				}

				if(instruction.type===VCD_NOOP){
					continue;

				}else if(instruction.type===VCD_ADD){
					addRunDataStream.copyToFile2(tempFile, addRunDataIndex+targetWindowPosition, size);
					addRunDataIndex += size;

				}else if(instruction.type===VCD_COPY){
					var addr = cache.decodeAddress(addRunDataIndex+winHeader.sourceLength, instruction.mode);
					var absAddr = 0;

					// source segment and target segment are treated as if they're concatenated
					var sourceData = null;
					if(addr < winHeader.sourceLength){
						absAddr = winHeader.sourcePosition + addr;
						if(winHeader.indicator & VCD_SOURCE){
							sourceData = romFile;
						}else if(winHeader.indicator & VCD_TARGET){
							sourceData = tempFile;
						}
					}else{
						absAddr = targetWindowPosition + (addr - winHeader.sourceLength);
						sourceData = tempFile;
					}

                    while(size--){
						tempFile._u8array[targetWindowPosition + addRunDataIndex++]=sourceData._u8array[absAddr++];
                        //targetU8[targetWindowPosition + targetWindowOffs++] = copySourceU8[absAddr++];
                    }
					//to-do: test
					//sourceData.copyToFile2(tempFile, absAddr, size, targetWindowPosition + addRunDataIndex);
					//addRunDataIndex += size;
				}else if(instruction.type===VCD_RUN){
					var runByte = addRunDataStream.readU8();
					var offset = targetWindowPosition + addRunDataIndex;
					for(var j=0; j<size; j++){
						tempFile._u8array[offset+j]=runByte;
					}

					addRunDataIndex += size;
				}else{
					throw new Error('invalid instruction type found');
				}
			}
		}

		if(validate && winHeader.adler32 && (winHeader.adler32 !== adler32(tempFile, targetWindowPosition, winHeader.targetWindowLength))){
			throw new Error('Target ROM checksum mismatch');
		}

		parser.skip(winHeader.addRunDataLength + winHeader.addressesLength + winHeader.instructionsLength);
		targetWindowPosition += winHeader.targetWindowLength;
	}

	//console.log((performance.now()-t0)/1000);
	return tempFile;
}

VCDIFF.MAGIC=VCDIFF_MAGIC;

VCDIFF.fromFile=function(file){
	return new VCDIFF(file);
}







function VCDIFF_Parser(binFile, offset)
{
	this.fileSize=binFile.fileSize;
	this._u8array=binFile._u8array;
    this.offset=offset || 0;

	/* reimplement readU8, readU32 and skip from BinFile */
	/* in web implementation, there are no guarantees BinFile will be dynamically loaded before this one */
	/* so we cannot rely on cloning BinFile.prototype */
	this.readU8 = binFile.readU8;
	this.readU32 = binFile.readU32;
	this.skip = binFile.skip;
	this.isEOF = binFile.isEOF;
	this.seek = binFile.seek;
}
VCDIFF_Parser.prototype.read7BitEncodedInt=function(){
	var num=0, bits = 0;

	do {
		bits = this.readU8();
		num = (num << 7) + (bits & 0x7f); 
	} while(bits & 0x80);

	return num;
}
VCDIFF_Parser.prototype.decodeWindowHeader=function(){
	var windowHeader={
		indicator:this.readU8(),
		sourceLength:0,
		sourcePosition:0,
		adler32:false
	};


	if(windowHeader.indicator & (VCD_SOURCE | VCD_TARGET)){
		windowHeader.sourceLength = this.read7BitEncodedInt();
		windowHeader.sourcePosition = this.read7BitEncodedInt();
	}

	windowHeader.deltaLength = this.read7BitEncodedInt();
	windowHeader.targetWindowLength = this.read7BitEncodedInt();
	windowHeader.deltaIndicator = this.readU8(); // secondary compression: 1=VCD_DATACOMP,2=VCD_INSTCOMP,4=VCD_ADDRCOMP

	windowHeader.addRunDataLength = this.read7BitEncodedInt();
	windowHeader.instructionsLength = this.read7BitEncodedInt();
	windowHeader.addressesLength = this.read7BitEncodedInt();

	if(windowHeader.indicator & VCD_ADLER32){
		windowHeader.adler32 = this.readU32();
	}


	return windowHeader;
}


VCDIFF_Parser.prototype.copyToFile2=function(target, targetOffset, len){
	for(var i=0; i<len; i++){
		target._u8array[targetOffset+i]=this._u8array[this.offset+i];
	}
	//this.file.copyToFile(target, this.offset, len, targetOffset);
	this.skip(len);
}

//------------------------------------------------------



// hdrIndicator
const VCD_DECOMPRESS = 0x01;
const VCD_CODETABLE  = 0x02;
const VCD_APPHEADER  = 0x04; // nonstandard?

// winIndicator
const VCD_SOURCE  = 0x01;
const VCD_TARGET  = 0x02;
const VCD_ADLER32 = 0x04;

// windowHeader.deltaIndicator bits (xdelta3.c VCD_DATACOMP/VCD_INSTCOMP/VCD_ADDRCOMP)
const VCD_DATACOMP = 0x01;
const VCD_INSTCOMP = 0x02;
const VCD_ADDRCOMP = 0x04;

//secondary compressor ids (xdelta3.c; not IANA-allocated)
const VCD_DJW_ID  = 1;
const VCD_LZMA_ID = 2;
const VCD_FGK_ID  = 16;





function VCD_Instruction(instruction, size, mode){
	this.type=instruction;
	this.size=size;
	this.mode=mode;
}

/*
	build the default code table (used to encode/decode instructions) specified in RFC 3284
	heavily based on
	https://github.com/vic-alexiev/TelerikAcademy/blob/master/C%23%20Fundamentals%20II/Homework%20Assignments/3.%20Methods/000.%20MiscUtil/Compression/Vcdiff/CodeTable.cs
*/
const VCD_NOOP=0;
const VCD_ADD=1;
const VCD_RUN=2;
const VCD_COPY=3;
const VCD_DEFAULT_CODE_TABLE=(function(){
	var entries=[];

	var empty = {type: VCD_NOOP, size: 0, mode: 0};

	// 0
	entries.push([{type: VCD_RUN, size: 0, mode: 0}, empty]);

	// 1,18
	for(var size=0; size<18; size++){
		entries.push([{type: VCD_ADD, size: size, mode: 0}, empty]);
	}

	// 19,162
	for(var mode=0; mode<9; mode++){
		entries.push([{type: VCD_COPY, size: 0, mode: mode}, empty]);
		
		for(var size=4; size<19; size++){
			entries.push([{type: VCD_COPY, size: size, mode: mode}, empty]);
		}
	}

	// 163,234
	for(var mode=0; mode<6; mode++){
		for(var addSize=1; addSize<5; addSize++){
			for(var copySize=4; copySize<7; copySize++){
				entries.push([{type:  VCD_ADD, size: addSize,  mode: 0},
							{type: VCD_COPY, size: copySize, mode: mode}]);
			}
		}
	}

	// 235,246
	for(var mode=6; mode<9; mode++){
		for(var addSize=1; addSize<5; addSize++){
			entries.push([{type:  VCD_ADD, size: addSize, mode: 0},
						{type: VCD_COPY, size:       4, mode: mode}]);
		}
	}

	// 247,255
	for(var mode=0; mode<9; mode++){
		entries.push([{type: VCD_COPY, size: 4, mode: mode},
					{type:  VCD_ADD, size: 1, mode: 0}]); 
	}

	return entries;
})();



/*
	ported from https://github.com/vic-alexiev/TelerikAcademy/tree/master/C%23%20Fundamentals%20II/Homework%20Assignments/3.%20Methods/000.%20MiscUtil/Compression/Vcdiff
	by Victor Alexiev (https://github.com/vic-alexiev)
*/
const VCD_MODE_SELF=0;
const VCD_MODE_HERE=1;
function VCD_AdressCache(nearSize, sameSize){
	this.nearSize=nearSize;
	this.sameSize=sameSize;

	this.near=new Array(nearSize);
	this.same=new Array(sameSize*256);
}
VCD_AdressCache.prototype.reset=function(addressStream){
	this.nextNearSlot=0;
	this.near.fill(0);
	this.same.fill(0);

	this.addressStream=addressStream;
}
VCD_AdressCache.prototype.decodeAddress=function(here, mode){
	var address=0;

	if(mode===VCD_MODE_SELF){
		address=this.addressStream.read7BitEncodedInt();
	}else if(mode===VCD_MODE_HERE){
		address=here-this.addressStream.read7BitEncodedInt();
	}else if(mode-2<this.nearSize){ //near cache
		address=this.near[mode-2]+this.addressStream.read7BitEncodedInt();
	}else{ //same cache
		var m=mode-(2+this.nearSize);
		address=this.same[m*256+this.addressStream.readU8()];
	}
	
	this.update(address);
	return address;
}
VCD_AdressCache.prototype.update=function(address){
	if(this.nearSize>0){
		this.near[this.nextNearSlot]=address;
		this.nextNearSlot=(this.nextNearSlot+1)%this.nearSize;
	}

	if(this.sameSize>0){
		this.same[address%(this.sameSize*256)]=address;
	}
}