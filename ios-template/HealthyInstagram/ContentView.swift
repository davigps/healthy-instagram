import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label("Hide distracting Instagram UI", systemImage: "eye.slash")
                    Label("Reels icon hidden on instagram.com", systemImage: "play.rectangle")
                }

                Section("Enable on iPhone") {
                    Text("1. Build and run this app on your device")
                    Text("2. Open Settings → Safari → Extensions")
                    Text("3. Turn on Healthy Instagram")
                    Text("4. Visit instagram.com in Safari")
                }
            }
            .navigationTitle("Healthy Instagram")
        }
    }
}

#Preview {
    ContentView()
}
