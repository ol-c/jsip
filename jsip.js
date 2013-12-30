$(function () {
    var canvas = document.createElement('canvas');
    $(canvas).css({
    	width : 0,
    	height : 0,
    	display : 'block'
    })
    var image = new Image();
    $('body').append(canvas);
    var file_input = $('<input type="file">');
    file_input.on('change', function (file_input_change_event) {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function (reader_load_event) {
        	image.onload = function (image_load_event) {
        		var width = this.width;
        		var height = this.height;
        		canvas.width = width;
        		canvas.height = height;
        		$(canvas).css({
                	width : width,
                	height : height,
                	display : 'block'
                });
        		var context = canvas.getContext('2d');
        		context.drawImage(image, 0, 0, width, height);
        		var image_data = context.getImageData(0, 0, width, height);
        	    var kernel = [
        	         0, -1,  0,
        	        -1,  4, -1,
        	         0, -1,  0];
        	    var grayscale_image = rgba_to_grayscale(image_data.data);
        	    var kernel_dimensions = [3, 3];
        	    var image_dimensions = [width, height];
        	    var filtered_image = filter(grayscale_image, image_dimensions, kernel, kernel_dimensions);
        		var filtered_image_data = context.createImageData(width, height);
        	    write_grayscale(filtered_image, filtered_image_data.data);
                context.putImageData(filtered_image_data, 0, 0);
        	    
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
    $('body').append(file_input);
});

function write_grayscale(data, image_data) {
    for (var i=0; i < data.length; i++) {
    	var index = i * 4;
    	image_data[index]   = data[i];
    	image_data[index+1] = data[i];
    	image_data[index+2] = data[i];
    	image_data[index+3] = 255;
    }
}

function rgba_to_grayscale(rgba) {
    var grayscale = [];
    for (var i = 0; i < rgba.length; i += 4) {
    	grayscale.push((rgba[i] + rgba[i+1] + rgba[i+2])/3);
    }
    return grayscale;
}

function filter(data, data_dimensions, kernel, kernel_dimensions) {
	var dimensions = kernel_dimensions.length;
	if (data_dimensions.length != dimensions) {
		throw new Error('kernel dimensions and data dimensions must match');
	}
	var output = [];
    for (var i = 0; i < data.length; i++) output.push(0);
    var kernel_center = (kernel.length - 1) / 2;
    for (var output_index = 0; output_index < output.length; output_index++) {
        for (var kernel_index = 0; kernel_index < kernel.length; kernel_index++) {
        	//  find kernel offset from center
        	kernel_offset = [];
        	var dimension_offset = 1;
        	for (var i = 0; i < kernel_dimensions.length; i++) {
        		kernel_offset[i] = Math.floor(kernel_index/dimension_offset % kernel_dimensions[i]) - (kernel_dimensions[i]-1)/2; // second part makes it offset from center of kernel
        		dimension_offset *= kernel_dimensions[i];
        	}
        	//  calcuate data dimensional offset and apply kernel offset
        	var data_offset = [];
        	dimension_offset = 1;
        	for (var i = 0; i < data_dimensions.length; i++) {
        		data_offset[i] = Math.floor(output_index/dimension_offset % data_dimensions[i]) + kernel_offset[i];
        		dimension_offset *= data_dimensions[i];
        	}
        	//  calculate data index using data dimensional offset
        	var data_index = 0;
        	dimensional_offset = 1;
        	for (var i = 0; i < data_offset.length; i++) {
        		data_index += data_offset[i] * dimensional_offset;
        		dimensional_offset *= data_dimensions[i];
        	}
        	//  clamp values to avoid undefined. still need to deal with dimensional wrapping
        	data_index = Math.max(0, Math.min(data_index, data.length-1));
        	output[output_index] += data[data_index] * kernel[kernel_index];
        }
    }
    return output;
}