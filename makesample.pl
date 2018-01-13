open(OUT, ">sample.js");
print OUT<<EOT;
"use strict";

var sample = [
EOT
while($f = <sample*.PEN>)
{
	open(IN, $f);
	print OUT "\"";
	while(<IN>)
	{
		s/\n/\\n/;
		print OUT $_ ;
	}
	print OUT "\",\n";
}
print OUT<<EOT;
];
EOT

close(OUT);
