#include<Arduino.h>
#include<cmath>

void setup(){
    Serial.begin(9600);
    while(!Serial);
}

void loop(){
    auto altitude = cos(millis() / 10000.0);
    Serial.print(R"({"altitude":)");
    Serial.print(altitude);
    Serial.print("}");
    Serial.println();
}