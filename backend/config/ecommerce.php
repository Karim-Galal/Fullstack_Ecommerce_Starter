<?php
return ['invitation_days'=>env('INVITATION_EXPIRY_DAYS',7),'payment_gateway'=>env('PAYMENT_GATEWAY','stripe')];
