#!/bin/bash

loc="C:\\workspace\\family-recipes\\src\\assets\\recipes\\"
x=853
y=1

while [ $y -le $x ]
do 
	name=$(printf "%04d" $y)
	file="${loc}${name}.json"
	replace="1/4"
	search="1?4"

	$(sed -i "s#$search#$replace#" $file)
	
	y=$(( $y + 1 ))
done

