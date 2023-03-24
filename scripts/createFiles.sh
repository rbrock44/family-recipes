#!/bin/bash

if [ -z "$1" ]
	then 
		echo "Hey pal, you need the number of files to create"
		exit
fi

loc="C:\\workspace\\family-recipes\\scripts\\"
x=337

while [ $x -le $1 ]
do 
	name=$(printf "%04d" $x)
	file="${loc}${name}.json"
	
	(
		echo '{';
		echo '   "name": "",';
		echo '   "author": "",';
		echo '   "category": 4,';
		echo '   "ingredients": [';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 1',;
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 2,';
		echo '         "name": ""';
		echo '      },';
		echo '      {';
		echo '         "amount": 3',;
		echo '         "name": ""';
		echo '      }';
		echo '   ],';
		echo '   "instructions": "",';
		echo '   "yield": {';
		echo '      "amount": 0,';
		echo '      "name": ""';
		echo '   }';
		echo '}';	
	) > $file;
	
	x=$(( $x + 1 ))
done

