#!/bin/bash

echo $0
echo $1
echo $2

script="$0"
path="$(dirname $script)"

echo $path

echo "Your AT&T monthly cost is $ $1.  Please pay via Venmo. My Venmo account is attached." | mail -s "Test Subject" $2 -A BillScreenShot.pdf -A myVenmo.jpeg

