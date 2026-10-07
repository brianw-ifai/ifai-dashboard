# Featured Offer, MAP, and a high-price suppression

Captured 5 Oct 2026. This is drill-down guidance, not a change to the live canvas.

**Featured Offer** is Amazon's name for the button this project has called the Buy Box (BB). They are the same thing. New writing says Featured Offer. Buy Box and BB are accepted aliases.

Fender's seller type is **Partner-led**. The five seller types, and the question each one is meant to answer, are in `docs/client-seller-models.md`. How each type is drawn on the dashboard is not decided.

## Tooltip

Use this when a listing is at MAP, or under MAP, and Amazon still shows no Featured Offer:

> A price at MAP can still lose the Featured Offer. Amazon withholds it when the offer, including shipping, is above a benchmark called the Competitive External Price: the lowest price Amazon recently found outside its store. Amazon does not name that retailer. Matching MAP does not pass this test.

Short form, if the tooltip has to stay one line:

> At MAP, and still no Featured Offer: Amazon's outside benchmark is lower than this offer. Amazon does not name the retailer.

## What the drill-down should show

For one ASIN, in this order:

1. Featured Offer, or no Featured Offer, and the words on the Amazon page ("High price") with the time of the reading.
2. The benchmark amount, and the offer's landed price (item plus shipping). The gap is the amount above the benchmark, not the amount above MAP.
3. Listings found at that benchmark amount, each with a URL. Label them as a price that matches Amazon's number. Amazon does not confirm the source.
4. One next step. Price an offer at the benchmark, correct the off-Amazon listing that matches it, or ask Amazon to review the reference because the matching product looks like the wrong configuration.

## Do we need Fender's Seller Central account?

No, not for the benchmark amount. Keepa's product record includes `competitivePriceThreshold`, in cents. That is Amazon's Competitive External Price. A Keepa lookup on 5 Oct 2026, about 23:10 UTC, returned it for all nine listings that had shown "High price" earlier that day.

Seller Central is still required for two things Keepa does not provide:

- Amazon's own split between "outside price" and "recent prices." The threshold above is the outside benchmark. The 60-day average selling price is a separate test.
- A reference-price review case. Amazon still will not name the retailer. The case asks them to check the match, not to reveal it.

Amazon's description of the benchmark is in the [Product Pricing API and Notifications FAQ](https://developer-docs.amazon.com/sp-api/docs/pricing-faq). The price is the lowest recently found at a reputable retailer outside Amazon. Pack size can be adjusted. A similar product from another brand can be used. Retailer names are not disclosed.

## What the nine listings showed tonight

Stored MAP is from `command.fmic_retail_buybox_map`. The new price, the benchmark, and the Featured Offer are from Keepa at about 23:10 UTC. Eight still have no Featured Offer (`buyBoxIsUnqualified`, no seller). On each of those, the new offer is above the benchmark.

| ASIN | Model | Stored MAP | New offer | Benchmark | Featured Offer |
| --- | --- | --- | --- | --- | --- |
| B0D2LP2PRQ | Player II Jazzmaster, Coral Red | $879.99 | $714.99 | $714.99 | Sweetwater Sound, new, $714.99 |
| B0D2LNNB24 | Player II Telecaster, Aged Cherry Burst | $949.99 | $949.99 | $849.99 | None. Offer is $100 above the benchmark |
| B0D2LPFNJ1 | Player II Stratocaster, Transparent Cherry Burst | $799.99 | $949.99 | $849.99 | None. Offer is $100 above the benchmark |
| B0D2LQNDS7 | Player II Telecaster, Butterscotch Blonde | $949.99 | $949.99 | $849.99 | None. Offer is $100 above the benchmark |
| B0D8G43XJP | Affinity Telecaster FMT SH, Crimson Red | $449.99 | $433.06 | $371.98 | None. Offer is under MAP and $61.08 above the benchmark |
| B0D2LMMBNR | Player II Stratocaster, White Blonde | $899.99 | $944.99 | $849.99 | None. Offer is $95 above the benchmark |
| B0D2M95G9J | Player II Jaguar, Coral Red | $879.99 | $879.99 | $718.99 | None. Offer is $161 above the benchmark |
| B00EOQ96ZG | American Professional Classic Hotshot Telecaster | $1,549.99 | $1,549.99 | $1,519.99 | None. Offer is $30 above the benchmark |
| B08L34LQZG | American Professional II Stratocaster, Mystic Surf Green | $1,839.99 | $1,639.99 | $1,339.99 | None. Offer is $200 under MAP and $300 above the benchmark |

The Jazzmaster is the one that changed. Earlier on 5 Oct the page had no Featured Offer and the new offers were $879.99. By 23:10 UTC Sweetwater held the Featured Offer at $714.99, the same figure as the benchmark. The other new offers on that page were still $879.99, which is MAP, and $165 above the benchmark.

The Affinity is the clearest "at MAP is not enough" case. The new offer, $433.06, is already under the stored MAP of $449.99, and it is still above Amazon's benchmark of $371.98.

## Candidate sources, not confirmed sources

A public price search the same night found listings at the benchmark amount.

**Player II Jazzmaster, Coral Red** (`B0D2LP2PRQ`, UPC 885978114597). Musician's Friend shows $714.99, down from $879.99. [Musician's Friend](https://www.musiciansfriend.com/guitars/fender-player-ii-jazzmaster-electric-guitar--rosewood-fingerboard/m11513000002000). fender.com, Dave's Guitar, and Fuller's Guitar show $879.99. Sweetwater's Amazon offer matches the Musician's Friend sale price. That is a candidate for the benchmark. It is not a statement from Amazon that Musician's Friend is the retailer they used.

**Affinity Telecaster FMT SH, Crimson Red Transparent** (`B0D8G43XJP`, UPC 885978134922, model 0378280538). Musician's Friend and Guitar Center both show $371.98, down from $449.99. [Musician's Friend](https://www.musiciansfriend.com/guitars/squier-affinity-series-telecaster-fmt-sh-electric-guitar/m12998000001000). [Guitar Center](https://www.guitarcenter.com/Squier/Affinity-Series-Telecaster-FMT-SH-Electric-Guitar-Transparent-Crimson-1500000432874.gc). Other shops show $367.99. The UPC on the Keepa record matches a Crimson Red Transparent listing. The $371.98 pages are the same model name. Confirm the UPC on those pages before telling a client they are the cause.

The American Professional II, `B08L34LQZG`, is the counterexample. Musician's Friend in our table is $1,639.99, the same as the Amazon offer, and the benchmark is $1,339.99. The stored Musician's Friend price does not explain that benchmark.

## Client note, using the Affinity

The Affinity Telecaster FMT SH is priced at $433.06 on Amazon, under the MAP of $449.99, and Amazon is still not showing a Featured Offer. Amazon's outside benchmark for this listing is $371.98, so the offer is $61.08 above the price Amazon is using. Musician's Friend and Guitar Center are both advertising this model at $371.98 tonight. Those pages match the benchmark. They are the first place to look. Raising those prices, or matching $371.98 on Amazon, is the practical next step. A MAP sheet alone will not restore the Featured Offer.

## What this pass did not do

The other 73 listings with a null seller were not opened and were not sent to Keepa. Jim Root Jazzmaster, `B00I5QXTYU`, was the listing that had gained a featured used offer earlier in the day. It was not in this Keepa batch. No Seller Central session was opened.
